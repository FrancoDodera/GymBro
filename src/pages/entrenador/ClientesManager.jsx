import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import AssignPlanModal from '../../components/AssignPlanModal';
import { useAuth } from '../../contexts/AuthContext';
import { clienteService, suscripcionService } from '../../api/directus';

const ClientesManager = () => {
    const { profile } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [subscriptions, setSubscriptions] = useState({});

    // Form state for creating client
    const [newCliente, setNewCliente] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        objetivo: '',
        fecha_nacimiento: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        setLoading(true);
        const data = await clienteService.getAll();
        // Filter only clients assigned to this trainer
        const myClientes = data.filter(c => c.entrenador_asignado === profile?.id);
        setClientes(myClientes);

        // Load subscriptions for all clients (optional - graceful fail)
        try {
            if (profile?.id) {
                const subs = await suscripcionService.getByEntrenador(profile.id);
                const subsMap = {};
                subs.forEach(sub => {
                    subsMap[sub.cliente_id] = sub;
                });
                setSubscriptions(subsMap);
            }
        } catch (error) {
            console.log('Could not load subscriptions (permissions may be missing):', error);
            // Continue without subscriptions - just won't show plan assignments
        }

        setLoading(false);
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            await clienteService.create({
                ...newCliente,
                entrenador_asignado: profile?.id
            });

            setShowCreateModal(false);
            setNewCliente({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                objetivo: '',
                fecha_nacimiento: ''
            });
            loadClientes();
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Error al crear el cliente. Verifica que el email no esté en uso.');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (cliente) => {
        if (!cliente.user_id?.id) {
            alert('Error: No se pudo obtener la información del usuario');
            return;
        }

        try {
            const newStatus = cliente.user_id.status === 'active' ? 'suspended' : 'active';
            await clienteService.toggleStatus(cliente.user_id.id, newStatus);
            loadClientes();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar el estado del cliente');
        }
    };

    const handleAssignPlan = (cliente) => {
        setSelectedCliente(cliente);
        setShowAssignPlanModal(true);
    };

    if (loading) {
        return <LoadingSpinner message="Cargando clientes..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                        Mis Clientes
                    </h1>
                    <p className="text-gray-400">Gestiona tus clientes y asigna planes de entrenamiento</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                >
                    + Crear Cliente
                </button>
            </div>

            {clientes.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-semibold mb-2">No tienes clientes</h3>
                        <p className="text-gray-400 mb-6">Crea tu primer cliente para comenzar</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Crear Cliente
                        </button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clientes.map((cliente) => {
                        const subscription = subscriptions[cliente.id];
                        const isActive = cliente.user_id?.status === 'active';

                        return (
                            <Card key={cliente.id} className={`${!isActive ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold mb-1">
                                                {cliente.user_id?.first_name} {cliente.user_id?.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-400">{cliente.user_id?.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    {cliente.objetivo && (
                                        <div className="mb-4 text-sm">
                                            <span className="text-gray-500">Objetivo:</span>
                                            <span className="text-gray-300 ml-2">{cliente.objetivo}</span>
                                        </div>
                                    )}

                                    {/* Subscription Info */}
                                    <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                                        {subscription ? (
                                            <>
                                                <div className="text-xs text-gray-500 mb-1">Plan Asignado:</div>
                                                <div className="font-medium text-primary-400">
                                                    {subscription.plan_id?.nombre}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Desde: {new Date(subscription.fecha_inicio).toLocaleDateString()}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-gray-500">Sin plan asignado</div>
                                        )}
                                    </div>

                                    <div className="mt-auto space-y-2">
                                        <button
                                            onClick={() => handleAssignPlan(cliente)}
                                            className="w-full btn btn-primary text-sm"
                                            disabled={!isActive}
                                        >
                                            {subscription ? 'Cambiar Plan' : 'Asignar Plan'}
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(cliente)}
                                            className={`w-full btn text-sm ${isActive
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                }`}
                                        >
                                            {isActive ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Client Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Crear Nuevo Cliente"
            >
                <form onSubmit={handleCreateClient}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nombre</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newCliente.first_name}
                                    onChange={(e) => setNewCliente({ ...newCliente, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Apellido</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newCliente.last_name}
                                    onChange={(e) => setNewCliente({ ...newCliente, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={newCliente.email}
                                onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Contraseña</label>
                            <input
                                type="password"
                                className="input"
                                value={newCliente.password}
                                onChange={(e) => setNewCliente({ ...newCliente, password: e.target.value })}
                                required
                                minLength="6"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label className="label">Objetivo (Opcional)</label>
                            <input
                                type="text"
                                className="input"
                                value={newCliente.objetivo}
                                onChange={(e) => setNewCliente({ ...newCliente, objetivo: e.target.value })}
                                placeholder="Ej: Pérdida de peso, Ganancia muscular..."
                            />
                        </div>

                        <div>
                            <label className="label">Fecha de Nacimiento (Opcional)</label>
                            <input
                                type="date"
                                className="input"
                                value={newCliente.fecha_nacimiento}
                                onChange={(e) => setNewCliente({ ...newCliente, fecha_nacimiento: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-dark-700">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="btn btn-secondary"
                            disabled={creating}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating}
                        >
                            {creating ? 'Creando...' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assign Plan Modal */}
            <AssignPlanModal
                isOpen={showAssignPlanModal}
                onClose={() => {
                    setShowAssignPlanModal(false);
                    setSelectedCliente(null);
                }}
                cliente={selectedCliente}
                onAssignSuccess={loadClientes}
            />
        </div>
    );
};

export default ClientesManager;
