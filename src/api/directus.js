import { createDirectus, rest, authentication, readMe, readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

// Storage for authentication tokens
const storage = {
    get: () => {
        const data = localStorage.getItem('directus_auth');
        return data ? JSON.parse(data) : null;
    },
    set: (data) => {
        localStorage.setItem('directus_auth', JSON.stringify(data));
    }
};

// Initialize Directus SDK with localStorage persistence
const client = createDirectus(directusUrl)
    .with(authentication('json', { storage }))
    .with(rest());

export default client;

// ============================================
// ROLE ID MAPPING - Hardcoded Directus Role IDs
// ============================================
// NOTE: These are PRODUCTION IDs from Render Directus
const ROLE_IDS = {
    ADMIN: '131bc633-08d9-4754-8527-92d20ad0ed31',
    CLIENTE: '13dac638-166e-4639-a9f6-e68746209968',
    ENTRENADOR: '1c1eb5b7-bfb0-4a0d-a595-faba8babbcd0'
};

// Map Role ID to Role Name
// LOGIC: If role is undefined, user is a Cliente (can't read their own role field)
//        If role is defined, use the mapping for Admin/Entrenador
function getRoleFromId(roleId) {
    console.log('[getRoleFromId] Checking roleId:', roleId);

    // If role is undefined, the user doesn't have permission to read it = Cliente
    if (roleId === undefined || roleId === null) {
        console.log('[getRoleFromId] Role is undefined/null - this is a Cliente');
        return 'Cliente';
    }

    // Map known role IDs
    switch (roleId) {
        case ROLE_IDS.ADMIN:
            console.log('[getRoleFromId] Matched Administrator');
            return 'Administrator';
        case ROLE_IDS.ENTRENADOR:
            console.log('[getRoleFromId] Matched Entrenador');
            return 'Entrenador';
        case ROLE_IDS.CLIENTE:
            console.log('[getRoleFromId] Matched Cliente');
            return 'Cliente';
        default:
            // Unknown role ID, default to Cliente for safety
            console.log('[getRoleFromId] Unknown role ID, defaulting to Cliente');
            return 'Cliente';
    }
}

// Helper function to get user profile based on role
async function getUserProfile(userId, role) {
    try {
        if (role === 'Cliente') {
            const clientes = await client.request(
                readItems('clientes', {
                    filter: { user_id: { _eq: userId } },
                    limit: 1
                })
            );
            return clientes?.[0] || null;
        }
        if (role === 'Entrenador') {
            const entrenadores = await client.request(
                readItems('entrenadores', {
                    filter: { user_id: { _eq: userId } },
                    limit: 1
                })
            );
            return entrenadores?.[0] || null;
        }
        return null;
    } catch (error) {
        console.log('[getUserProfile] Could not fetch profile (may be permission issue):', error.message);
        return null;
    }
}

// Auth Service
export const authService = {
    async login(email, password) {
        try {
            // Perform login using SDK (handles token storage)
            await client.login(email, password);

            // Get current user using REST API directly (SDK doesn't return all fields)
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${authData.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user data');
            }

            const userData = await response.json();
            const user = userData.data;

            console.log('[authService.login] User from REST API:', user);
            console.log('[authService.login] Role ID from user:', user.role);

            // Map role ID to role name - if undefined, user is a Cliente
            const roleName = getRoleFromId(user.role);
            console.log('[authService.login] Detected role:', roleName);

            // Try to get profile (may fail due to permissions, that's ok)
            const profile = await getUserProfile(user.id, roleName);

            return { user, roleName, profile };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await client.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async getCurrentUser() {
        try {
            // Get current user using REST API directly
            const authData = storage.get();
            if (!authData?.access_token) {
                return null;
            }

            const response = await fetch(`${directusUrl}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${authData.access_token}`
                }
            });

            if (!response.ok) {
                return null;
            }

            const userData = await response.json();
            const user = userData.data;

            console.log('[authService.getCurrentUser] User from REST API:', user);
            console.log('[authService.getCurrentUser] Role ID:', user.role);

            // Map role ID to role name - if undefined, user is a Cliente
            const detectedRole = getRoleFromId(user.role);
            console.log('[authService.getCurrentUser] Detected role:', detectedRole);

            // Add detectedRole to user object for AuthContext
            user.detectedRole = detectedRole;

            // Try to get profile
            user.profile = await getUserProfile(user.id, detectedRole);

            return user;
        } catch (error) {
            console.error('[authService.getCurrentUser] Error:', error);
            return null;
        }
    }
};

// Profile Service - For user profile management
export const profileService = {
    async updateUserInfo(userId, data) {
        try {
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    ...(data.avatar !== undefined && { avatar: data.avatar })
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.errors?.[0]?.message || 'Error updating user');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating user info:', error);
            throw error;
        }
    },

    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const authData = storage.get();
            const response = await fetch(`${directusUrl}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error uploading avatar');
            }

            const data = await response.json();
            return data.data; // Returns file object with id
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    },

    async updateClienteProfile(clienteId, data) {
        try {
            const response = await client.request(
                updateItem('clientes', clienteId, {
                    objetivo: data.objetivo,
                    fecha_nacimiento: data.fecha_nacimiento,
                    altura_cm: data.altura_cm,
                    peso_kg: data.peso_kg
                })
            );
            return response;
        } catch (error) {
            console.error('Error updating cliente profile:', error);
            throw error;
        }
    },

    async updateEntrenadorProfile(entrenadorId, data) {
        try {
            const response = await client.request(
                updateItem('entrenadores', entrenadorId, {
                    especialidad: data.especialidad,
                    descripcion: data.descripcion,
                    certificaciones: data.certificaciones,
                    anos_experiencia: data.anos_experiencia
                })
            );
            return response;
        } catch (error) {
            console.error('Error updating entrenador profile:', error);
            throw error;
        }
    },

    async changePassword(currentPassword, newPassword) {
        try {
            const authData = storage.get();

            // Directus doesn't have a direct password change endpoint for current user
            // We need to use the users/me endpoint with password field
            const response = await fetch(`${directusUrl}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({
                    password: newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.errors?.[0]?.message || 'Error changing password');
            }

            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
};

// Entrenador Service
export const entrenadorService = {
    async getMyProfile(userId) {
        try {
            const response = await client.request(
                readItems('entrenadores', {
                    filter: { user_id: { _eq: userId } },
                    fields: ['*', 'user_id.email', 'user_id.first_name', 'user_id.last_name']
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting entrenador profile:', error);
            return null;
        }
    },

    async getMyClients(entrenadorId) {
        try {
            const response = await client.request(
                readItems('clientes', {
                    filter: { entrenador_asignado: { _eq: entrenadorId } },
                    fields: ['*', 'user_id.first_name', 'user_id.last_name', 'user_id.email']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting clients:', error);
            return [];
        }
    },

    async createClient(clientData) {
        try {
            // First create user
            const user = await client.request(
                createItem('directus_users', {
                    email: clientData.email,
                    password: clientData.password,
                    first_name: clientData.firstName,
                    last_name: clientData.lastName,
                    role: clientData.roleId,
                    status: 'active'
                })
            );

            // Then create cliente record
            const cliente = await client.request(
                createItem('clientes', {
                    user_id: user.id,
                    entrenador_asignado: clientData.entrenadorId,
                    objetivo: clientData.objetivo || '',
                    altura_cm: clientData.altura || null
                })
            );

            return cliente;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    }
};

// Cliente Service
export const clienteService = {
    async create(data) {
        try {
            // Hardcoded Cliente role ID (avoids needing permission to read roles)
            const clienteRoleId = ROLE_IDS.CLIENTE;

            console.log('[clienteService.create] Creating user with data:', {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                role: clienteRoleId,
                entrenador_asignado: data.entrenador_asignado
            });

            // Use REST API directly for creating users (core collection)
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    role: clienteRoleId,
                    status: 'active'
                })
            });

            const responseData = await response.json();
            console.log('[clienteService.create] User creation response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.errors?.[0]?.message || 'Error creating user');
            }

            const userId = responseData.data.id;
            console.log('[clienteService.create] User created with ID:', userId);
            console.log('[clienteService.create] User role assigned:', responseData.data.role);

            // Then create the cliente record
            const clienteResponse = await client.request(
                createItem('clientes', {
                    user_id: userId,
                    entrenador_asignado: data.entrenador_asignado,
                    objetivo: data.objetivo || null,
                    fecha_nacimiento: data.fecha_nacimiento || null
                })
            );

            console.log('[clienteService.create] Cliente record created:', clienteResponse);
            return clienteResponse;
        } catch (error) {
            console.error('Error creating cliente:', error);
            throw error;
        }
    },

    async getAll() {
        try {
            const response = await client.request(
                readItems('clientes', {
                    fields: ['*', 'user_id.id', 'user_id.email', 'user_id.first_name', 'user_id.last_name', 'user_id.status', 'entrenador_asignado']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting all clientes:', error);
            return [];
        }
    },

    async toggleStatus(userId, newStatus) {
        try {
            // Use REST API for updating users
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update user status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error toggling status:', error);
            throw error;
        }
    },

    async getMyProfile(userId) {
        try {
            const response = await client.request(
                readItems('clientes', {
                    filter: { user_id: { _eq: userId } },
                    fields: ['*', 'user_id.*', 'entrenador_asignado.user_id.first_name', 'entrenador_asignado.user_id.last_name']
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting cliente profile:', error);
            return null;
        }
    },

    async getMySessions(clienteId) {
        try {
            const response = await client.request(
                readItems('sesiones_registro', {
                    filter: { cliente_id: { _eq: clienteId } },
                    sort: ['-fecha'],
                    limit: 100
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    },

    async createSession(sessionData) {
        try {
            console.log('Creating session with data:', sessionData);
            const response = await client.request(
                createItem('sesiones_registro', sessionData)
            );
            console.log('Session created:', response);
            return response;
        } catch (error) {
            console.error('Error creating session:', error);
            console.error('Session data that failed:', sessionData);
            throw error;
        }
    },

    async getMySessions(clienteId) {
        try {
            const response = await client.request(
                readItems('sesiones_registro', {
                    filter: {
                        cliente_id: { _eq: clienteId }
                    },
                    sort: ['-fecha'],
                    limit: 50
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    },

    async getMySubscription(clienteId) {
        try {
            const response = await client.request(
                readItems('suscripciones', {
                    filter: {
                        cliente_id: { _eq: clienteId },
                        habilitado: { _eq: true }
                    },
                    fields: ['*', 'plan_id.nombre', 'plan_id.descripcion', 'plan_id.duracion_dias'],
                    limit: 1,
                    sort: ['-fecha_inicio']
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting subscription:', error);
            return null;
        }
    }
};

// Planes Service
export const planesService = {
    async getAll() {
        try {
            const response = await client.request(
                readItems('planes', {
                    filter: { activo: { _eq: true } }
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting planes:', error);
            return [];
        }
    },

    async getAllWithExercises() {
        try {
            const response = await client.request(
                readItems('planes', {
                    fields: ['*', 'ejercicios.*'],
                    sort: ['nombre']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting planes with exercises:', error);
            return [];
        }
    },

    async getById(planId) {
        try {
            const response = await client.request(
                readItems('planes', {
                    filter: { id: { _eq: planId } },
                    fields: ['*', 'ejercicios.*'],
                    limit: 1
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting plan:', error);
            return null;
        }
    },

    async create(planData) {
        try {
            const response = await client.request(
                createItem('planes', planData)
            );
            return response;
        } catch (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
    },

    async createWithExercises(planData, ejercicios) {
        try {
            // First create the plan
            const plan = await client.request(
                createItem('planes', planData)
            );

            // Then create exercises linked to the plan
            for (let i = 0; i < ejercicios.length; i++) {
                const ej = ejercicios[i];
                let ejercicioId;

                // If it's a library exercise, use existing ejercicio_id
                if (ej.mode === 'library' && ej.ejercicio_id) {
                    ejercicioId = ej.ejercicio_id;
                } else {
                    // Ad-hoc exercise: create in ejercicios table first
                    const nuevoEjercicio = await client.request(
                        createItem('ejercicios', {
                            nombre: ej.nombre,
                            descripcion: ej.descripcion || '',
                            categoria: ej.categoria || 'general',
                            nivel_dificultad: ej.nivel_dificultad || 'intermedio',
                            grupo_muscular: ej.grupo_muscular || null,
                            imagen_referencia: ej.imagen_referencia || null,
                            video_referencia: ej.video_referencia || null,
                            instrucciones: ej.instrucciones || ''
                        })
                    );
                    ejercicioId = nuevoEjercicio.id;
                }

                // Now create the junction record with only metadata
                await client.request(
                    createItem('ejercicios_plan', {
                        plan_id: plan.id,
                        ejercicio_id: ejercicioId,
                        series: ej.series,
                        repeticiones: ej.repeticiones,
                        duracion_minutos: ej.duracion_minutos,
                        orden: i,
                        notas: ej.notas || null
                    })
                );
            }

            return plan;
        } catch (error) {
            console.error('Error creating plan with exercises:', error);
            throw error;
        }
    },

    async updateWithExercises(planId, planData, ejercicios) {
        try {
            // Update the plan
            await client.request(
                updateItem('planes', planId, planData)
            );

            // Get existing exercises
            const existing = await client.request(
                readItems('ejercicios_plan', {
                    filter: { plan_id: { _eq: planId } }
                })
            );

            // Delete existing exercises
            for (const ej of existing || []) {
                await client.request(
                    deleteItem('ejercicios_plan', ej.id)
                );
            }

            // Create new exercises
            for (let i = 0; i < ejercicios.length; i++) {
                const ej = ejercicios[i];
                let ejercicioId;

                // If it's a library exercise, use existing ejercicio_id
                if (ej.mode === 'library' && ej.ejercicio_id) {
                    ejercicioId = ej.ejercicio_id;
                } else {
                    // Ad-hoc exercise: create in ejercicios table first
                    const nuevoEjercicio = await client.request(
                        createItem('ejercicios', {
                            nombre: ej.nombre,
                            descripcion: ej.descripcion || '',
                            categoria: ej.categoria || 'general',
                            nivel_dificultad: ej.nivel_dificultad || 'intermedio',
                            grupo_muscular: ej.grupo_muscular || null,
                            imagen_referencia: ej.imagen_referencia || null,
                            video_referencia: ej.video_referencia || null,
                            instrucciones: ej.instrucciones || ''
                        })
                    );
                    ejercicioId = nuevoEjercicio.id;
                }

                // Now create the junction record with only metadata
                await client.request(
                    createItem('ejercicios_plan', {
                        plan_id: parseInt(planId),
                        ejercicio_id: ejercicioId,
                        series: ej.series,
                        repeticiones: ej.repeticiones,
                        duracion_minutos: ej.duracion_minutos,
                        orden: i,
                        notas: ej.notas || null
                    })
                );
            }

            return true;
        } catch (error) {
            console.error('Error updating plan with exercises:', error);
            throw error;
        }
    },

    async update(planId, planData) {
        try {
            const response = await client.request(
                updateItem('planes', planId, planData)
            );
            return response;
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
    },

    async delete(planId) {
        try {
            await client.request(
                deleteItem('planes', planId)
            );
        } catch (error) {
            console.error('Error deleting plan:', error);
            throw error;
        }
    }
};

// Suscripcion Service
export const suscripcionService = {
    async assignPlan(clienteId, planId, fechaInicio) {
        try {
            const response = await client.request(
                createItem('suscripciones', {
                    cliente_id: clienteId,
                    plan_id: planId,
                    fecha_inicio: fechaInicio,
                    habilitado: true
                })
            );
            return response;
        } catch (error) {
            console.error('Error assigning plan:', error);
            throw error;
        }
    },

    async getByCliente(clienteId) {
        try {
            const response = await client.request(
                readItems('suscripciones', {
                    filter: {
                        cliente_id: { _eq: clienteId },
                        habilitado: { _eq: true }
                    },
                    fields: [
                        '*',
                        'plan_id.*',
                        'plan_id.ejercicios.*',
                        'plan_id.ejercicios.imagen_referencia.*',
                        'plan_id.ejercicios.video_referencia.*',
                        'plan_id.ejercicios.ejercicio_id.*',
                        'plan_id.ejercicios.ejercicio_id.imagen_referencia.*',
                        'plan_id.ejercicios.ejercicio_id.video_referencia.*',
                        'plan_id.ejercicios.ejercicio_id.imagen_url_1',
                        'plan_id.ejercicios.ejercicio_id.imagen_url_2'
                    ],
                    sort: ['-fecha_inicio'],
                    limit: 1
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting cliente subscription:', error);
            return null;
        }
    },

    async update(id, data) {
        try {
            const response = await client.request(
                updateItem('suscripciones', id, data)
            );
            return response;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    },

    async disable(id) {
        try {
            const response = await client.request(
                updateItem('suscripciones', id, { habilitado: false })
            );
            return response;
        } catch (error) {
            console.error('Error disabling subscription:', error);
            throw error;
        }
    },

    async getByEntrenador(entrenadorId) {
        try {
            // Get all active subscriptions (filter by trainer happens in frontend)
            const response = await client.request(
                readItems('suscripciones', {
                    filter: {
                        habilitado: { _eq: true }
                    },
                    fields: ['*', 'cliente_id', 'plan_id.id', 'plan_id.nombre']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting trainer subscriptions:', error);
            return [];
        }
    }
};

// Admin Service
export const adminService = {
    async getStats() {
        try {
            // Use separate try-catch for each to handle permission issues
            let totalUsers = 0;
            let totalTrainers = 0;
            let totalClients = 0;

            try {
                const trainers = await client.request(readItems('entrenadores'));
                totalTrainers = trainers?.length || 0;
            } catch (e) {
                console.log('Could not fetch trainers count');
            }

            try {
                const clients = await client.request(readItems('clientes'));
                totalClients = clients?.length || 0;
            } catch (e) {
                console.log('Could not fetch clients count');
            }

            // For users, count trainers + clients + 1 (admin)
            totalUsers = totalTrainers + totalClients + 1;

            return {
                totalUsers,
                totalTrainers,
                totalClients
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { totalUsers: 0, totalTrainers: 0, totalClients: 0 };
        }
    },

    // ============================================
    // TRAINER MANAGEMENT
    // ============================================

    async getTrainers() {
        try {
            const response = await client.request(
                readItems('entrenadores', {
                    fields: ['*', 'user_id.id', 'user_id.email', 'user_id.first_name', 'user_id.last_name', 'user_id.status', 'user_id.avatar']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting trainers:', error);
            return [];
        }
    },

    async getTrainersWithClientCount() {
        try {
            const trainers = await client.request(
                readItems('entrenadores', {
                    fields: ['*', 'user_id.id', 'user_id.email', 'user_id.first_name', 'user_id.last_name', 'user_id.status', 'user_id.avatar']
                })
            );

            // Get all clients to count per trainer
            const clients = await client.request(readItems('clientes'));

            // Add client count to each trainer
            const trainersWithCount = (trainers || []).map(trainer => {
                const clientCount = (clients || []).filter(c => c.entrenador_asignado === trainer.id).length;
                return { ...trainer, clientCount };
            });

            return trainersWithCount;
        } catch (error) {
            console.error('Error getting trainers with client count:', error);
            return [];
        }
    },

    async createTrainer(data) {
        try {
            const entrenadorRoleId = ROLE_IDS.ENTRENADOR;

            console.log('[adminService.createTrainer] Creating trainer with data:', {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                role: entrenadorRoleId
            });

            // Create user via REST API
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    role: entrenadorRoleId,
                    status: 'active'
                })
            });

            const responseData = await response.json();
            console.log('[adminService.createTrainer] User creation response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.errors?.[0]?.message || 'Error creating user');
            }

            const userId = responseData.data.id;

            // Create entrenador record
            const entrenadorResponse = await client.request(
                createItem('entrenadores', {
                    user_id: userId,
                    especialidad: data.especialidad || null,
                    descripcion: data.descripcion || null
                })
            );

            console.log('[adminService.createTrainer] Entrenador record created:', entrenadorResponse);
            return entrenadorResponse;
        } catch (error) {
            console.error('Error creating trainer:', error);
            throw error;
        }
    },

    async toggleTrainerStatus(userId, isActive) {
        try {
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({ status: isActive ? 'active' : 'suspended' })
            });

            if (!response.ok) {
                throw new Error('Failed to update trainer status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error toggling trainer status:', error);
            throw error;
        }
    },

    async deleteTrainer(entrenadorId, userId) {
        try {
            // First delete the entrenador record
            await client.request(deleteItem('entrenadores', entrenadorId));

            // Then delete the user
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authData.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            return true;
        } catch (error) {
            console.error('Error deleting trainer:', error);
            throw error;
        }
    },

    // ============================================
    // CLIENT MANAGEMENT (ADMIN LEVEL)
    // ============================================

    async getAllClients() {
        try {
            const response = await client.request(
                readItems('clientes', {
                    fields: ['*', 'user_id.id', 'user_id.email', 'user_id.first_name', 'user_id.last_name', 'user_id.status', 'user_id.avatar', 'entrenador_asignado.id', 'entrenador_asignado.user_id.first_name', 'entrenador_asignado.user_id.last_name']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting all clients:', error);
            return [];
        }
    },

    async createClient(data) {
        try {
            const clienteRoleId = ROLE_IDS.CLIENTE;

            console.log('[adminService.createClient] Creating client with data:', {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                entrenador_asignado: data.entrenador_asignado
            });

            // Create user via REST API
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    role: clienteRoleId,
                    status: 'active'
                })
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.errors?.[0]?.message || 'Error creating user');
            }

            const userId = responseData.data.id;

            // Create cliente record
            const clienteResponse = await client.request(
                createItem('clientes', {
                    user_id: userId,
                    entrenador_asignado: data.entrenador_asignado || null,
                    objetivo: data.objetivo || null,
                    fecha_nacimiento: data.fecha_nacimiento || null
                })
            );

            console.log('[adminService.createClient] Cliente record created:', clienteResponse);
            return clienteResponse;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    },

    async toggleClientStatus(userId, newStatus) {
        try {
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.access_token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update client status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error toggling client status:', error);
            throw error;
        }
    },

    async reassignTrainer(clienteId, newTrainerId) {
        try {
            const response = await client.request(
                updateItem('clientes', clienteId, {
                    entrenador_asignado: newTrainerId || null
                })
            );
            return response;
        } catch (error) {
            console.error('Error reassigning trainer:', error);
            throw error;
        }
    },

    async deleteClient(clienteId, userId) {
        try {
            // First delete the cliente record
            await client.request(deleteItem('clientes', clienteId));

            // Then delete the user
            const authData = storage.get();
            const response = await fetch(`${directusUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authData.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            return true;
        } catch (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
    },

    // ============================================
    // PLANS MANAGEMENT (ADMIN LEVEL)
    // ============================================

    async getAllPlans() {
        try {
            const response = await client.request(
                readItems('planes', {
                    fields: ['*', 'ejercicios.*', 'entrenadores.entrenadores_id.id', 'entrenadores.entrenadores_id.user_id.first_name', 'entrenadores.entrenadores_id.user_id.last_name'],
                    sort: ['nombre']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting all plans:', error);
            return [];
        }
    },

    async createPlan(planData) {
        try {
            // Extract entrenadores array for M2M relationship
            const { entrenadores_ids, ...restData } = planData;

            // Create plan with M2M relationship format
            const planPayload = {
                ...restData,
                entrenadores: entrenadores_ids ? entrenadores_ids.map(id => ({
                    entrenadores_id: parseInt(id)
                })) : []
            };

            const response = await client.request(
                createItem('planes', planPayload)
            );
            return response;
        } catch (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
    },

    async updatePlan(planId, planData) {
        try {
            const response = await client.request(
                updateItem('planes', planId, planData)
            );
            return response;
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
    },

    async updatePlanTrainers(planId, trainerIds) {
        try {
            // Update M2M relationship - Directus expects array of junction objects
            const response = await client.request(
                updateItem('planes', planId, {
                    entrenadores: trainerIds.map(id => ({
                        entrenadores_id: parseInt(id)
                    }))
                })
            );
            return response;
        } catch (error) {
            console.error('Error updating plan trainers:', error);
            throw error;
        }
    },

    async togglePlanStatus(planId, isActive) {
        try {
            const response = await client.request(
                updateItem('planes', planId, { activo: isActive })
            );
            return response;
        } catch (error) {
            console.error('Error toggling plan status:', error);
            throw error;
        }
    },

    async deletePlan(planId) {
        try {
            await client.request(deleteItem('planes', planId));
            return true;
        } catch (error) {
            console.error('Error deleting plan:', error);
            throw error;
        }
    }
};

// Ejercicios Service
export const ejerciciosService = {
    async getAll() {
        try {
            const response = await client.request(
                readItems('ejercicios', {
                    filter: { activo: { _eq: true } },
                    fields: ['*', 'imagen_referencia.*', 'video_referencia.*', 'imagen_url_1', 'imagen_url_2'],
                    sort: ['-fecha_creacion'],
                    limit: -1  // -1 = sin límite, obtener TODOS los ejercicios
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting ejercicios:', error);
            return [];
        }
    },

    async getById(ejercicioId) {
        try {
            const response = await client.request(
                readItems('ejercicios', {
                    filter: { id: { _eq: ejercicioId } },
                    fields: ['*', 'imagen_referencia.*', 'video_referencia.*', 'imagen_url_1', 'imagen_url_2'],
                    limit: 1
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting ejercicio:', error);
            return null;
        }
    },

    async create(ejercicioData) {
        try {
            const response = await client.request(
                createItem('ejercicios', ejercicioData)
            );
            return response;
        } catch (error) {
            console.error('Error creating ejercicio:', error);
            throw error;
        }
    },

    async update(ejercicioId, ejercicioData) {
        try {
            const response = await client.request(
                updateItem('ejercicios', ejercicioId, ejercicioData)
            );
            return response;
        } catch (error) {
            console.error('Error updating ejercicio:', error);
            throw error;
        }
    },

    async delete(ejercicioId) {
        try {
            // Soft delete - set activo to false
            await client.request(
                updateItem('ejercicios', ejercicioId, { activo: false })
            );
        } catch (error) {
            console.error('Error deleting ejercicio:', error);
            throw error;
        }
    },

    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use Directus SDK's built-in upload instead of raw fetch
            const response = await fetch(`${directusUrl}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${storage.get()?.access_token}`
                    // Do NOT set Content-Type header - browser will set it automatically with boundary
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Upload error details:', errorData);
                throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    async deleteFile(fileId) {
        try {
            await client.request(
                deleteItem('directus_files', fileId)
            );
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
};

// ============================================
// Planes IA Service - AI-Generated Plans
// ============================================
export const planesIAService = {
    /**
     * Create a new AI-generated plan with exercises
     */
    async create(planData, ejercicios) {
        try {
            console.log('[planesIAService.create] Creating AI plan:', planData);

            // Create the plan
            const plan = await client.request(
                createItem('planes_ia', {
                    cliente_id: planData.cliente_id,
                    nombre: planData.nombre,
                    descripcion: planData.descripcion,
                    objetivo: planData.objetivo,
                    nivel_experiencia: planData.nivel_experiencia,
                    duracion_tipo: planData.duracion_tipo,
                    dias_semana: planData.dias_semana,
                    equipamiento: planData.equipamiento,
                    limitaciones: planData.limitaciones,
                    prompt_usado: planData.prompt_usado,
                    activo: true
                })
            );

            console.log('[planesIAService.create] Plan created:', plan);

            // Create exercise relationships
            for (const ejercicio of ejercicios) {
                await client.request(
                    createItem('ejercicios_plan_ia', {
                        plan_ia_id: plan.id,
                        ejercicio_id: ejercicio.ejercicio_id,
                        dia: ejercicio.dia || 1,
                        orden: ejercicio.orden,
                        series: ejercicio.series,
                        repeticiones: ejercicio.repeticiones,
                        duracion_minutos: ejercicio.duracion_minutos,
                        notas: ejercicio.notas
                    })
                );
            }

            console.log('[planesIAService.create] Exercises linked:', ejercicios.length);
            return plan;
        } catch (error) {
            console.error('Error creating AI plan:', error);
            throw error;
        }
    },

    /**
     * Get all AI plans for a specific cliente
     */
    async getByCliente(clienteId) {
        try {
            const response = await client.request(
                readItems('planes_ia', {
                    filter: {
                        cliente_id: { _eq: clienteId }
                    },
                    fields: [
                        '*',
                        'ejercicios.id',
                        'ejercicios.ejercicio_id.*',
                        'ejercicios.ejercicio_id.imagen_referencia.*',
                        'ejercicios.ejercicio_id.video_referencia.*',
                        'ejercicios.dia',
                        'ejercicios.orden',
                        'ejercicios.series',
                        'ejercicios.repeticiones',
                        'ejercicios.duracion_minutos',
                        'ejercicios.notas'
                    ],
                    sort: ['-fecha_generacion']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting AI plans:', error);
            return [];
        }
    },

    /**
     * Get the active AI plan for a cliente
     */
    async getActiveByCliente(clienteId) {
        try {
            const response = await client.request(
                readItems('planes_ia', {
                    filter: {
                        cliente_id: { _eq: clienteId },
                        activo: { _eq: true }
                    },
                    fields: [
                        '*',
                        'ejercicios.id',
                        'ejercicios.dia',
                        'ejercicios.orden',
                        'ejercicios.series',
                        'ejercicios.repeticiones',
                        'ejercicios.duracion_minutos',
                        'ejercicios.notas',
                        'ejercicios.ejercicio_id.id',
                        'ejercicios.ejercicio_id.nombre',
                        'ejercicios.ejercicio_id.descripcion',
                        'ejercicios.ejercicio_id.categoria',
                        'ejercicios.ejercicio_id.nivel_dificultad',
                        'ejercicios.ejercicio_id.imagen_url_1',
                        'ejercicios.ejercicio_id.imagen_url_2',
                        'ejercicios.ejercicio_id.imagen_referencia',
                        'ejercicios.ejercicio_id.video_referencia'
                    ],
                    sort: ['-fecha_generacion'],
                    limit: 1
                })
            );
            console.log('[planesIAService.getActiveByCliente] Response:', response);
            console.log('[planesIAService.getActiveByCliente] First item:', response?.[0]);
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting active AI plan:', error);
            return null;
        }
    },

    /**
     * Get a specific AI plan by ID
     */
    async getById(planId) {
        try {
            const response = await client.request(
                readItems('planes_ia', {
                    filter: { id: { _eq: planId } },
                    fields: [
                        '*',
                        'ejercicios.id',
                        'ejercicios.ejercicio_id.*',
                        'ejercicios.ejercicio_id.imagen_referencia.*',
                        'ejercicios.ejercicio_id.video_referencia.*',
                        'ejercicios.ejercicio_id.imagen_url_1',
                        'ejercicios.ejercicio_id.imagen_url_2',
                        'ejercicios.dia',
                        'ejercicios.orden',
                        'ejercicios.series',
                        'ejercicios.repeticiones',
                        'ejercicios.duracion_minutos',
                        'ejercicios.notas'
                    ],
                    limit: 1
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting AI plan by ID:', error);
            return null;
        }
    },

    /**
     * Update an AI plan (metadata only, not exercises)
     */
    async update(planId, planData) {
        try {
            const response = await client.request(
                updateItem('planes_ia', planId, {
                    nombre: planData.nombre,
                    descripcion: planData.descripcion,
                    objetivo: planData.objetivo,
                    nivel_experiencia: planData.nivel_experiencia,
                    duracion_tipo: planData.duracion_tipo,
                    dias_semana: planData.dias_semana,
                    equipamiento: planData.equipamiento,
                    limitaciones: planData.limitaciones,
                    activo: planData.activo
                })
            );
            return response;
        } catch (error) {
            console.error('Error updating AI plan:', error);
            throw error;
        }
    },

    /**
     * Deactivate a plan (soft delete)
     */
    async deactivate(planId) {
        try {
            const response = await client.request(
                updateItem('planes_ia', planId, { activo: false })
            );
            return response;
        } catch (error) {
            console.error('Error deactivating AI plan:', error);
            throw error;
        }
    },

    /**
     * Delete all exercises of a plan and create new ones
     * Useful for regenerating a plan
     */
    async replaceExercises(planId, nuevosEjercicios) {
        try {
            // Get existing exercises
            const existing = await client.request(
                readItems('ejercicios_plan_ia', {
                    filter: { plan_ia_id: { _eq: planId } }
                })
            );

            // Delete existing exercises
            for (const ej of existing || []) {
                await client.request(
                    deleteItem('ejercicios_plan_ia', ej.id)
                );
            }

            // Create new exercises
            for (const ejercicio of nuevosEjercicios) {
                await client.request(
                    createItem('ejercicios_plan_ia', {
                        plan_ia_id: planId,
                        ejercicio_id: ejercicio.ejercicio_id,
                        dia: ejercicio.dia || 1,
                        orden: ejercicio.orden,
                        series: ejercicio.series,
                        repeticiones: ejercicio.repeticiones,
                        duracion_minutos: ejercicio.duracion_minutos,
                        notas: ejercicio.notas
                    })
                );
            }

            return true;
        } catch (error) {
            console.error('Error replacing exercises:', error);
            throw error;
        }
    },

    /**
     * Regenerate a plan with new preferences
     * Deactivates the old plan and creates a new one
     */
    async regenerate(oldPlanId, newPlanData, ejercicios) {
        try {
            // Deactivate old plan
            await this.deactivate(oldPlanId);

            // Create new plan
            const newPlan = await this.create(newPlanData, ejercicios);

            return newPlan;
        } catch (error) {
            console.error('Error regenerating plan:', error);
            throw error;
        }
    }
};
