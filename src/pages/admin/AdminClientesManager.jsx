import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import { adminService } from '../../api/directus';

const AdminClientesManager = () => {
    const [clientes, setClientes] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [filterTrainer, setFilterTrainer] = useState('all');

    // Form state for creating client
    const [newCliente, setNewCliente] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        objetivo: '',
        fecha_nacimiento: '',
        entrenador_asignado: ''
    });
    const [creating, setCreating] = useState(false);

    // Reassign form state
    const [newTrainerId, setNewTrainerId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [clientesData, trainersData] = await Promise.all([
            adminService.getAllClients(),
            adminService.getTrainers()
        ]);
        setClientes(clientesData);
        setTrainers(trainersData);
        setLoading(false);
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            await adminService.createClient({
                ...newCliente,
                entrenador_asignado: newCliente.entrenador_asignado || null
            });
            setShowCreateModal(false);
            setNewCliente({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                objetivo: '',
                fecha_nacimiento: '',
                entrenador_asignado: ''
            });
            loadData();
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
            await adminService.toggleClientStatus(cliente.user_id.id, newStatus);
            loadData();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar el estado del cliente');
        }
    };

    const handleReassign = async () => {
        if (!selectedCliente) return;

        try {
            await adminService.reassignTrainer(selectedCliente.id, newTrainerId || null);
            setShowReassignModal(false);
            setSelectedCliente(null);
            setNewTrainerId('');
            loadData();
        } catch (error) {
            console.error('Error reassigning trainer:', error);
            alert('Error al reasignar el entrenador');
        }
    };

    const handleDelete = async () => {
        if (!selectedCliente) return;

        try {
            await adminService.deleteClient(selectedCliente.id, selectedCliente.user_id?.id);
            setShowDeleteModal(false);
            setSelectedCliente(null);
            loadData();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Error al eliminar el cliente');
        }
    };

    const openReassignModal = (cliente) => {
        setSelectedCliente(cliente);
        setNewTrainerId(cliente.entrenador_asignado?.id || '');
        setShowReassignModal(true);
    };

    // Filter clients by trainer
    const filteredClientes = filterTrainer === 'all'
        ? clientes
        : filterTrainer === 'none'
            ? clientes.filter(c => !c.entrenador_asignado)
            : clientes.filter(c => c.entrenador_asignado?.id === parseInt(filterTrainer));

    if (loading) {
        return <LoadingSpinner message="Cargando clientes..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                        Gestión de Clientes
                    </h1>
                    <p className="text-gray-400">Administra todos los clientes del sistema</p>
                </div>
                <div className="flex gap-3">
                    {/* Filter dropdown */}
                    <select
                        value={filterTrainer}
                        onChange={(e) => setFilterTrainer(e.target.value)}
                        className="input bg-dark-700 text-sm"
                    >
                        <option value="all">Todos los clientes</option>
                        <option value="none">Sin entrenador</option>
                        {trainers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.user_id?.first_name} {t.user_id?.last_name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                    >
                        + Crear Cliente
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary-400">{clientes.length}</p>
                        <p className="text-xs text-gray-400">Total Clientes</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                            {clientes.filter(c => c.user_id?.status === 'active').length}
                        </p>
                        <p className="text-xs text-gray-400">Activos</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-400">
                            {clientes.filter(c => c.user_id?.status !== 'active').length}
                        </p>
                        <p className="text-xs text-gray-400">Inactivos</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-accent-400">
                            {clientes.filter(c => !c.entrenador_asignado).length}
                        </p>
                        <p className="text-xs text-gray-400">Sin Entrenador</p>
                    </div>
                </Card>
            </div>

            {filteredClientes.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-semibold mb-2">
                            {filterTrainer === 'all' ? 'No hay clientes' : 'No hay clientes con este filtro'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {filterTrainer === 'all' ? 'Crea el primer cliente del sistema' : 'Prueba con otro filtro'}
                        </p>
                        {filterTrainer === 'all' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                Crear Cliente
                            </button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClientes.map((cliente) => {
                        const isActive = cliente.user_id?.status === 'active';
                        const trainerName = cliente.entrenador_asignado
                            ? `${cliente.entrenador_asignado.user_id?.first_name || ''} ${cliente.entrenador_asignado.user_id?.last_name || ''}`.trim()
                            : null;

                        return (
                            <Card key={cliente.id} className={`${!isActive ? 'opacity-60' : ''} hover:border-primary-500/50 transition-colors`}>
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Avatar
                                            src={cliente.user_id?.avatar}
                                            firstName={cliente.user_id?.first_name}
                                            lastName={cliente.user_id?.last_name}
                                            size="lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-lg font-bold mb-1 truncate">
                                                    {cliente.user_id?.first_name} {cliente.user_id?.last_name}
                                                </h3>
                                                <span className={`flex-shrink-0 ml-2 px-2 py-1 text-xs rounded-full ${isActive
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 truncate">{cliente.user_id?.email}</p>
                                        </div>
                                    </div>

                                    {cliente.objetivo && (
                                        <div className="mb-3">
                                            <span className="text-xs text-gray-500">Objetivo:</span>
                                            <p className="text-sm text-gray-300">{cliente.objetivo}</p>
                                        </div>
                                    )}

                                    {/* Trainer info */}
                                    <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                                        <span className="text-xs text-gray-500">Entrenador asignado:</span>
                                        {trainerName ? (
                                            <p className="text-sm font-medium text-primary-400">{trainerName}</p>
                                        ) : (
                                            <p className="text-sm text-orange-400">Sin entrenador</p>
                                        )}
                                    </div>

                                    <div className="mt-auto space-y-2">
                                        <button
                                            onClick={() => openReassignModal(cliente)}
                                            className="w-full btn btn-secondary text-sm"
                                        >
                                            {trainerName ? 'Cambiar Entrenador' : 'Asignar Entrenador'}
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(cliente)}
                                                className={`flex-1 btn text-sm ${isActive
                                                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    }`}
                                            >
                                                {isActive ? 'Suspender' : 'Activar'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCliente(cliente);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="flex-1 btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
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
                            <label className="label">Entrenador (Opcional)</label>
                            <select
                                className="input"
                                value={newCliente.entrenador_asignado}
                                onChange={(e) => setNewCliente({ ...newCliente, entrenador_asignado: e.target.value })}
                            >
                                <option value="">Sin asignar</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.user_id?.first_name} {t.user_id?.last_name}
                                    </option>
                                ))}
                            </select>
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

            {/* Reassign Trainer Modal */}
            <Modal
                isOpen={showReassignModal}
                onClose={() => setShowReassignModal(false)}
                title="Asignar Entrenador"
            >
                <div className="py-4">
                    <p className="text-gray-300 mb-4">
                        Selecciona un entrenador para{' '}
                        <span className="font-semibold text-white">
                            {selectedCliente?.user_id?.first_name} {selectedCliente?.user_id?.last_name}
                        </span>
                    </p>
                    <select
                        className="input w-full"
                        value={newTrainerId}
                        onChange={(e) => setNewTrainerId(e.target.value)}
                    >
                        <option value="">Sin entrenador</option>
                        {trainers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.user_id?.first_name} {t.user_id?.last_name}
                                {t.especialidad ? ` - ${t.especialidad}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={() => setShowReassignModal(false)}
                        className="btn btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleReassign}
                        className="btn btn-primary"
                    >
                        Guardar
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmar Eliminación"
            >
                <div className="py-4">
                    <p className="text-gray-300">
                        ¿Estás seguro de eliminar al cliente "{selectedCliente?.user_id?.first_name} {selectedCliente?.user_id?.last_name}"?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Esta acción no se puede deshacer. Se eliminará la cuenta de usuario y todos sus datos.
                    </p>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={() => setShowDeleteModal(false)}
                        className="btn btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn bg-red-500 hover:bg-red-600 text-white"
                    >
                        Eliminar
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminClientesManager;
