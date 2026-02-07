import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import { adminService } from '../../api/directus';

const TrainersManager = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [trainerToDelete, setTrainerToDelete] = useState(null);
    const [trainerToEdit, setTrainerToEdit] = useState(null);

    // Form state for creating trainer
    const [newTrainer, setNewTrainer] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        especialidad: '',
        descripcion: ''
    });
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Form state for editing trainer
    const [editTrainer, setEditTrainer] = useState({
        first_name: '',
        last_name: '',
        email: '',
        especialidad: '',
        descripcion: ''
    });

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        setLoading(true);
        const data = await adminService.getTrainersWithClientCount();
        setTrainers(data);
        setLoading(false);
    };

    const handleCreateTrainer = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            await adminService.createTrainer(newTrainer);
            setShowCreateModal(false);
            setNewTrainer({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                especialidad: '',
                descripcion: ''
            });
            loadTrainers();
        } catch (error) {
            console.error('Error creating trainer:', error);
            alert('Error al crear el entrenador. Verifica que el email no esté en uso.');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (trainer) => {
        if (!trainer.user_id?.id) {
            alert('Error: No se pudo obtener la información del usuario');
            return;
        }

        try {
            const isActive = trainer.user_id.status === 'active';
            await adminService.toggleTrainerStatus(trainer.user_id.id, !isActive);
            loadTrainers();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar el estado del entrenador');
        }
    };

    const handleDelete = async () => {
        if (!trainerToDelete) return;

        try {
            await adminService.deleteTrainer(trainerToDelete.id, trainerToDelete.user_id?.id);
            setShowDeleteModal(false);
            setTrainerToDelete(null);
            loadTrainers();
        } catch (error) {
            console.error('Error deleting trainer:', error);
            alert('Error al eliminar el entrenador. Asegúrate de que no tenga clientes asignados.');
        }
    };

    const handleEditClick = (trainer) => {
        setTrainerToEdit(trainer);
        setEditTrainer({
            first_name: trainer.user_id?.first_name || '',
            last_name: trainer.user_id?.last_name || '',
            email: trainer.user_id?.email || '',
            especialidad: trainer.especialidad || '',
            descripcion: trainer.descripcion || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTrainer = async (e) => {
        e.preventDefault();
        if (!trainerToEdit) return;

        setUpdating(true);
        try {
            await adminService.updateTrainer(
                trainerToEdit.id,
                trainerToEdit.user_id?.id,
                editTrainer
            );
            setShowEditModal(false);
            setTrainerToEdit(null);
            loadTrainers();
        } catch (error) {
            console.error('Error updating trainer:', error);
            alert('Error al actualizar el entrenador. Verifica que el email no esté en uso.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando entrenadores..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                        Gestión de Entrenadores
                    </h1>
                    <p className="text-gray-400">Administra los entrenadores del sistema</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                >
                    + Crear Entrenador
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary-400">{trainers.length}</p>
                        <p className="text-xs text-gray-400">Total Entrenadores</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                            {trainers.filter(t => t.user_id?.status === 'active').length}
                        </p>
                        <p className="text-xs text-gray-400">Activos</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-400">
                            {trainers.filter(t => t.user_id?.status !== 'active').length}
                        </p>
                        <p className="text-xs text-gray-400">Inactivos</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-accent-400">
                            {trainers.reduce((sum, t) => sum + (t.clientCount || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-400">Clientes Totales</p>
                    </div>
                </Card>
            </div>

            {trainers.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏋️</div>
                        <h3 className="text-xl font-semibold mb-2">No hay entrenadores</h3>
                        <p className="text-gray-400 mb-6">Crea el primer entrenador del sistema</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Crear Entrenador
                        </button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainers.map((trainer) => {
                        const isActive = trainer.user_id?.status === 'active';

                        return (
                            <Card key={trainer.id} className={`${!isActive ? 'opacity-60' : ''} hover:border-primary-500/50 transition-colors`}>
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Avatar
                                            src={trainer.user_id?.avatar}
                                            firstName={trainer.user_id?.first_name}
                                            lastName={trainer.user_id?.last_name}
                                            size="lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-lg font-bold mb-1 truncate">
                                                    {trainer.user_id?.first_name} {trainer.user_id?.last_name}
                                                </h3>
                                                <span className={`flex-shrink-0 ml-2 px-2 py-1 text-xs rounded-full ${isActive
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 truncate">{trainer.user_id?.email}</p>
                                        </div>
                                    </div>

                                    {trainer.especialidad && (
                                        <div className="mb-3">
                                            <span className="text-xs text-gray-500">Especialidad:</span>
                                            <p className="text-sm text-primary-400">{trainer.especialidad}</p>
                                        </div>
                                    )}

                                    {trainer.descripcion && (
                                        <div className="mb-3">
                                            <span className="text-xs text-gray-500">Descripción:</span>
                                            <p className="text-sm text-gray-300 line-clamp-2">{trainer.descripcion}</p>
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400">Clientes asignados:</span>
                                            <span className="text-lg font-bold text-accent-400">
                                                {trainer.clientCount || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-2">
                                        <button
                                            onClick={() => handleEditClick(trainer)}
                                            className="w-full btn bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(trainer)}
                                            className={`w-full btn text-sm ${isActive
                                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                }`}
                                        >
                                            {isActive ? 'Suspender' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTrainerToDelete(trainer);
                                                setShowDeleteModal(true);
                                            }}
                                            className="w-full btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
                                            disabled={trainer.clientCount > 0}
                                            title={trainer.clientCount > 0 ? 'No se puede eliminar un entrenador con clientes asignados' : ''}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Trainer Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Crear Nuevo Entrenador"
            >
                <form onSubmit={handleCreateTrainer}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nombre</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newTrainer.first_name}
                                    onChange={(e) => setNewTrainer({ ...newTrainer, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Apellido</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newTrainer.last_name}
                                    onChange={(e) => setNewTrainer({ ...newTrainer, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={newTrainer.email}
                                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Contraseña</label>
                            <input
                                type="password"
                                className="input"
                                value={newTrainer.password}
                                onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })}
                                required
                                minLength="6"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label className="label">Especialidad (Opcional)</label>
                            <input
                                type="text"
                                className="input"
                                value={newTrainer.especialidad}
                                onChange={(e) => setNewTrainer({ ...newTrainer, especialidad: e.target.value })}
                                placeholder="Ej: Crossfit, Musculación, Funcional..."
                            />
                        </div>

                        <div>
                            <label className="label">Descripción (Opcional)</label>
                            <textarea
                                className="input min-h-[80px] resize-none"
                                value={newTrainer.descripcion}
                                onChange={(e) => setNewTrainer({ ...newTrainer, descripcion: e.target.value })}
                                placeholder="Breve descripción del entrenador..."
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
                            {creating ? 'Creando...' : 'Crear Entrenador'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Trainer Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Entrenador"
            >
                <form onSubmit={handleUpdateTrainer}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nombre</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editTrainer.first_name}
                                    onChange={(e) => setEditTrainer({ ...editTrainer, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Apellido</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editTrainer.last_name}
                                    onChange={(e) => setEditTrainer({ ...editTrainer, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={editTrainer.email}
                                onChange={(e) => setEditTrainer({ ...editTrainer, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Especialidad (Opcional)</label>
                            <input
                                type="text"
                                className="input"
                                value={editTrainer.especialidad}
                                onChange={(e) => setEditTrainer({ ...editTrainer, especialidad: e.target.value })}
                                placeholder="Ej: Crossfit, Musculación, Funcional..."
                            />
                        </div>

                        <div>
                            <label className="label">Descripción (Opcional)</label>
                            <textarea
                                className="input min-h-[80px] resize-none"
                                value={editTrainer.descripcion}
                                onChange={(e) => setEditTrainer({ ...editTrainer, descripcion: e.target.value })}
                                placeholder="Breve descripción del entrenador..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-dark-700">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="btn btn-secondary"
                            disabled={updating}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={updating}
                        >
                            {updating ? 'Actualizando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmar Eliminación"
            >
                <div className="py-4">
                    <p className="text-gray-300">
                        ¿Estás seguro de eliminar al entrenador "{trainerToDelete?.user_id?.first_name} {trainerToDelete?.user_id?.last_name}"?
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

export default TrainersManager;
