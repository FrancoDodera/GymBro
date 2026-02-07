
// ============================================
// Gimnasio Service - Multi-tenant Gimnasio Management
// ============================================
export const gimnasioService = {
    /**
     * Get all gimnasios (Super Admin only)
     */
    async getAll() {
        try {
            const response = await client.request(
                readItems('gimnasios', {
                    fields: [
                        '*',
                        'user_id.id',
                        'user_id.first_name',
                        'user_id.last_name',
                        'user_id.email'
                    ],
                    sort: ['-fecha_registro']
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting all gimnasios:', error);
            return [];
        }
    },

    /**
     * Get gimnasio by user_id (for Gimnasio role users)
     */
    async getMyGimnasio(userId) {
        try {
            const response = await client.request(
                readItems('gimnasios', {
                    filter: { user_id: { _eq: userId } },
                    fields: ['*'],
                    limit: 1
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting my gimnasio:', error);
            return null;
        }
    },

    /**
     * Get gimnasio by ID
     */
    async getById(gimnasioId) {
        try {
            const response = await client.request(
                readItems('gimnasios', {
                    filter: { id: { _eq: gimnasioId } },
                    fields: [
                        '*',
                        'user_id.first_name',
                        'user_id.last_name',
                        'user_id.email'
                    ],
                    limit: 1
                })
            );
            return response?.[0] || null;
        } catch (error) {
            console.error('Error getting gimnasio by ID:', error);
            return null;
        }
    },

    /**
     * Get all entrenadores of a gimnasio
     */
    async getEntrenadores(gimnasioId) {
        try {
            const response = await client.request(
                readItems('entrenadores', {
                    filter: { gimnasio_id: { _eq: gimnasioId } },
                    fields: [
                        '*',
                        'user_id.id',
                        'user_id.first_name',
                        'user_id.last_name',
                        'user_id.email',
                        'user_id.status'
                    ]
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting entrenadores for gimnasio:', error);
            return [];
        }
    },

    /**
     * Get all clientes of a gimnasio (via entrenadores)
     */
    async getClientes(gimnasioId) {
        try {
            // First get all entrenadores of this gimnasio
            const entrenadores = await this.getEntrenadores(gimnasioId);
            const entrenadorIds = entrenadores.map(e => e.id);

            if (entrenadorIds.length === 0) {
                return [];
            }

            // Then get all clientes assigned to these entrenadores
            const response = await client.request(
                readItems('clientes', {
                    filter: {
                        entrenador_asignado: { _in: entrenadorIds }
                    },
                    fields: [
                        '*',
                        'user_id.id',
                        'user_id.first_name',
                        'user_id.last_name',
                        'user_id.email',
                        'user_id.status',
                        'entrenador_asignado.id',
                        'entrenador_asignado.user_id.first_name',
                        'entrenador_asignado.user_id.last_name'
                    ]
                })
            );
            return response || [];
        } catch (error) {
            console.error('Error getting clientes for gimnasio:', error);
            return [];
        }
    },

    /**
     * Update gimnasio information
     */
    async update(gimnasioId, data) {
        try {
            const response = await client.request(
                updateItem('gimnasios', gimnasioId, data)
            );
            return response;
        } catch (error) {
            console.error('Error updating gimnasio:', error);
            throw error;
        }
    },

    /**
     * Create new gimnasio (Super Admin only)
     */
    async create(data) {
        try {
            const response = await client.request(
                createItem('gimnasios', data)
            );
            return response;
        } catch (error) {
            console.error('Error creating gimnasio:', error);
            throw error;
        }
    },

    /**
     * Toggle gimnasio active status
     */
    async toggleStatus(gimnasioId, activo) {
        try {
            const response = await client.request(
                updateItem('gimnasios', gimnasioId, { activo })
            );
            return response;
        } catch (error) {
            console.error('Error toggling gimnasio status:', error);
            throw error;
        }
    },

    /**
     * Get gimnasio statistics
     */
    async getStats(gimnasioId) {
        try {
            const [entrenadores, clientes] = await Promise.all([
                this.getEntrenadores(gimnasioId),
                this.getClientes(gimnasioId)
            ]);

            return {
                totalEntrenadores: entrenadores.length,
                totalClientes: clientes.length,
                entrenadoresActivos: entrenadores.filter(e => e.user_id?.status === 'active').length,
                clientesActivos: clientes.filter(c => c.user_id?.status === 'active').length
            };
        } catch (error) {
            console.error('Error getting gimnasio stats:', error);
            return {
                totalEntrenadores: 0,
                totalClientes: 0,
                entrenadoresActivos: 0,
                clientesActivos: 0
            };
        }
    }
};
