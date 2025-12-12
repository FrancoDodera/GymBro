import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { adminService } from '../../api/directus';

const AdminPlanesManager = () => {
    const [planes, setPlanes] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditTrainersModal, setShowEditTrainersModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [filterTrainer, setFilterTrainer] = useState('all');

    // Form state for creating plan
    const [newPlan, setNewPlan] = useState({
        nombre: '',
        descripcion: '',
        duracion_dias: 30,
        activo: true,
        entrenadores_ids: []
    });
    const [creating, setCreating] = useState(false);

    // Edit trainers state
    const [editTrainerIds, setEditTrainerIds] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [planesData, trainersData] = await Promise.all([
            adminService.getAllPlans(),
            adminService.getTrainers()
        ]);
        setPlanes(planesData);
        setTrainers(trainersData);
        setLoading(false);
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            await adminService.createPlan({
                nombre: newPlan.nombre,
                descripcion: newPlan.descripcion,
                duracion_dias: parseInt(newPlan.duracion_dias) || 30,
                activo: newPlan.activo,
                entrenadores_ids: newPlan.entrenadores_ids
            });
            setShowCreateModal(false);
            setNewPlan({
                nombre: '',
                descripcion: '',
                duracion_dias: 30,
                activo: true,
                entrenadores_ids: []
            });
            loadData();
        } catch (error) {
            console.error('Error creating plan:', error);
            alert('Error al crear el plan');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (plan) => {
        try {
            await adminService.togglePlanStatus(plan.id, !plan.activo);
            loadData();
        } catch (error) {
            console.error('Error toggling plan status:', error);
            alert('Error al cambiar el estado del plan');
        }
    };

    const handleDelete = async () => {
        if (!planToDelete) return;

        try {
            await adminService.deletePlan(planToDelete.id);
            setShowDeleteModal(false);
            setPlanToDelete(null);
            loadData();
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Error al eliminar el plan. Puede que esté asignado a clientes.');
        }
    };

    const openEditTrainersModal = (plan) => {
        setSelectedPlan(plan);
        // Extract trainer IDs from the M2M relationship
        const currentTrainerIds = (plan.entrenadores || []).map(e =>
            e.entrenadores_id?.id?.toString() || ''
        ).filter(id => id);
        setEditTrainerIds(currentTrainerIds);
        setShowEditTrainersModal(true);
    };

    const handleSaveTrainers = async () => {
        if (!selectedPlan) return;
        setSaving(true);

        try {
            await adminService.updatePlanTrainers(selectedPlan.id, editTrainerIds);
            setShowEditTrainersModal(false);
            setSelectedPlan(null);
            setEditTrainerIds([]);
            loadData();
        } catch (error) {
            console.error('Error updating trainers:', error);
            alert('Error al actualizar los entrenadores');
        } finally {
            setSaving(false);
        }
    };

    const toggleTrainerSelection = (trainerId) => {
        const id = trainerId.toString();
        if (editTrainerIds.includes(id)) {
            setEditTrainerIds(editTrainerIds.filter(t => t !== id));
        } else {
            setEditTrainerIds([...editTrainerIds, id]);
        }
    };

    const toggleNewPlanTrainer = (trainerId) => {
        const id = trainerId.toString();
        if (newPlan.entrenadores_ids.includes(id)) {
            setNewPlan({
                ...newPlan,
                entrenadores_ids: newPlan.entrenadores_ids.filter(t => t !== id)
            });
        } else {
            setNewPlan({
                ...newPlan,
                entrenadores_ids: [...newPlan.entrenadores_ids, id]
            });
        }
    };

    // Helper to get trainer names from M2M relationship
    const getTrainerNames = (plan) => {
        if (!plan.entrenadores || plan.entrenadores.length === 0) return null;
        return plan.entrenadores
            .map(e => {
                const trainer = e.entrenadores_id;
                if (!trainer?.user_id) return null;
                return `${trainer.user_id.first_name || ''} ${trainer.user_id.last_name || ''}`.trim();
            })
            .filter(name => name)
            .join(', ');
    };

    // Filter plans by trainer
    const filteredPlanes = filterTrainer === 'all'
        ? planes
        : filterTrainer === 'none'
            ? planes.filter(p => !p.entrenadores || p.entrenadores.length === 0)
            : planes.filter(p =>
                p.entrenadores?.some(e => e.entrenadores_id?.id === parseInt(filterTrainer))
            );

    if (loading) {
        return <LoadingSpinner message="Cargando planes..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                        Gestión de Planes
                    </h1>
                    <p className="text-gray-400">Administra todos los planes de entrenamiento</p>
                </div>
                <div className="flex gap-3">
                    {/* Filter dropdown */}
                    <select
                        value={filterTrainer}
                        onChange={(e) => setFilterTrainer(e.target.value)}
                        className="input bg-dark-700 text-sm"
                    >
                        <option value="all">Todos los planes</option>
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
                        + Crear Plan
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary-400">{planes.length}</p>
                        <p className="text-xs text-gray-400">Total Planes</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                            {planes.filter(p => p.activo).length}
                        </p>
                        <p className="text-xs text-gray-400">Activos</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-400">
                            {planes.filter(p => !p.activo).length}
                        </p>
                        <p className="text-xs text-gray-400">Inactivos</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-accent-400">
                            {planes.reduce((sum, p) => sum + (p.ejercicios?.length || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-400">Total Ejercicios</p>
                    </div>
                </Card>
            </div>

            {filteredPlanes.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2">
                            {filterTrainer === 'all' ? 'No hay planes' : 'No hay planes con este filtro'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {filterTrainer === 'all' ? 'Crea el primer plan de entrenamiento' : 'Prueba con otro filtro'}
                        </p>
                        {filterTrainer === 'all' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                Crear Plan
                            </button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlanes.map((plan) => {
                        const trainerNames = getTrainerNames(plan);

                        return (
                            <Card key={plan.id} className={`${!plan.activo ? 'opacity-60' : ''} hover:border-primary-500/50 transition-colors`}>
                                <div className="flex flex-col h-full">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-xl font-bold">{plan.nombre}</h3>
                                            <span className={`badge ${plan.activo ? 'badge-success' : 'badge-danger'}`}>
                                                {plan.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>

                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                            {plan.descripcion || 'Sin descripción'}
                                        </p>

                                        <div className="flex gap-4 text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <span>💪</span>
                                                {plan.ejercicios?.length || 0} ejercicios
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span>📅</span>
                                                {plan.duracion_dias || '?'} días
                                            </span>
                                        </div>

                                        {/* Trainers info */}
                                        <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500">Entrenadores asignados:</span>
                                                <button
                                                    onClick={() => openEditTrainersModal(plan)}
                                                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                            </div>
                                            {trainerNames ? (
                                                <p className="text-sm font-medium text-primary-400">{trainerNames}</p>
                                            ) : (
                                                <p className="text-sm text-gray-500">Sin entrenadores (Plan global)</p>
                                            )}
                                        </div>

                                        {/* Ejercicios preview */}
                                        {plan.ejercicios && plan.ejercicios.length > 0 && (
                                            <div className="space-y-1 mb-4">
                                                {plan.ejercicios.slice(0, 3).map((ej, idx) => (
                                                    <div key={idx} className="text-sm text-gray-400 flex items-center gap-2">
                                                        <span className="text-primary-400">•</span>
                                                        {ej.nombre}
                                                        {ej.series && ej.repeticiones && (
                                                            <span className="text-gray-500">
                                                                ({ej.series}x{ej.repeticiones})
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                                {plan.ejercicios.length > 3 && (
                                                    <div className="text-sm text-gray-500">
                                                        +{plan.ejercicios.length - 3} más...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
                                        <button
                                            onClick={() => handleToggleStatus(plan)}
                                            className={`flex-1 btn text-sm ${plan.activo
                                                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                }`}
                                        >
                                            {plan.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPlanToDelete(plan);
                                                setShowDeleteModal(true);
                                            }}
                                            className="flex-1 btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
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

            {/* Create Plan Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Crear Nuevo Plan"
            >
                <form onSubmit={handleCreatePlan}>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="label">Nombre del Plan</label>
                            <input
                                type="text"
                                className="input"
                                value={newPlan.nombre}
                                onChange={(e) => setNewPlan({ ...newPlan, nombre: e.target.value })}
                                required
                                placeholder="Ej: Plan Fuerza Básico"
                            />
                        </div>

                        <div>
                            <label className="label">Descripción</label>
                            <textarea
                                className="input min-h-[80px] resize-none"
                                value={newPlan.descripcion}
                                onChange={(e) => setNewPlan({ ...newPlan, descripcion: e.target.value })}
                                placeholder="Descripción del plan de entrenamiento..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Duración (días)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={newPlan.duracion_dias}
                                    onChange={(e) => setNewPlan({ ...newPlan, duracion_dias: e.target.value })}
                                    min="1"
                                    max="365"
                                />
                            </div>
                            <div>
                                <label className="label">Estado</label>
                                <select
                                    className="input"
                                    value={newPlan.activo ? 'true' : 'false'}
                                    onChange={(e) => setNewPlan({ ...newPlan, activo: e.target.value === 'true' })}
                                >
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Asignar Entrenadores (Opcional)</label>
                            <p className="text-xs text-gray-500 mb-2">
                                Selecciona uno o más entrenadores. Si no seleccionas ninguno, el plan será global.
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-dark-700 rounded-lg">
                                {trainers.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay entrenadores disponibles</p>
                                ) : (
                                    trainers.map(t => (
                                        <label
                                            key={t.id}
                                            className="flex items-center gap-3 p-2 hover:bg-dark-600 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newPlan.entrenadores_ids.includes(t.id.toString())}
                                                onChange={() => toggleNewPlanTrainer(t.id)}
                                                className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                                            />
                                            <span className="text-sm">
                                                {t.user_id?.first_name} {t.user_id?.last_name}
                                            </span>
                                            {t.especialidad && (
                                                <span className="text-xs text-gray-500">({t.especialidad})</span>
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>
                            {newPlan.entrenadores_ids.length > 0 && (
                                <p className="text-xs text-primary-400 mt-1">
                                    {newPlan.entrenadores_ids.length} entrenador(es) seleccionado(s)
                                </p>
                            )}
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
                            {creating ? 'Creando...' : 'Crear Plan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Trainers Modal */}
            <Modal
                isOpen={showEditTrainersModal}
                onClose={() => setShowEditTrainersModal(false)}
                title="Editar Entrenadores"
            >
                <div className="py-4">
                    <p className="text-gray-300 mb-4">
                        Selecciona los entrenadores para el plan{' '}
                        <span className="font-semibold text-white">"{selectedPlan?.nombre}"</span>
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-dark-700 rounded-lg">
                        {trainers.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay entrenadores disponibles</p>
                        ) : (
                            trainers.map(t => (
                                <label
                                    key={t.id}
                                    className="flex items-center gap-3 p-2 hover:bg-dark-600 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={editTrainerIds.includes(t.id.toString())}
                                        onChange={() => toggleTrainerSelection(t.id)}
                                        className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="text-sm">
                                        {t.user_id?.first_name} {t.user_id?.last_name}
                                    </span>
                                    {t.especialidad && (
                                        <span className="text-xs text-gray-500">({t.especialidad})</span>
                                    )}
                                </label>
                            ))
                        )}
                    </div>
                    {editTrainerIds.length > 0 ? (
                        <p className="text-xs text-primary-400 mt-2">
                            {editTrainerIds.length} entrenador(es) seleccionado(s)
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-2">
                            Sin selección = Plan global (visible para todos)
                        </p>
                    )}
                </div>
                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={() => setShowEditTrainersModal(false)}
                        className="btn btn-secondary"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveTrainers}
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
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
                        ¿Estás seguro de eliminar el plan "{planToDelete?.nombre}"?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Esta acción no se puede deshacer. Los ejercicios del plan también serán eliminados.
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

export default AdminPlanesManager;
