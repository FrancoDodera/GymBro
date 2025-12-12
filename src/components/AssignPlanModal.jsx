import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { planesService, suscripcionService } from '../api/directus';

const AssignPlanModal = ({ isOpen, onClose, cliente, onAssignSuccess }) => {
    const [planes, setPlanes] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPlanes();
        }
    }, [isOpen]);

    const loadPlanes = async () => {
        setLoading(true);
        const data = await planesService.getAll();
        const activePlanes = data.filter(p => p.activo);
        setPlanes(activePlanes);
        setLoading(false);
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedPlan) return;

        setSaving(true);
        try {
            const plan = planes.find(p => p.id === selectedPlan);
            const fechaInicio = new Date().toISOString().split('T')[0];

            await suscripcionService.assignPlan(
                cliente.id,
                selectedPlan,
                fechaInicio
            );

            onAssignSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error assigning plan:', error);
            alert('Error al asignar el plan');
        } finally {
            setSaving(false);
        }
    };

    if (!cliente) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asignar Plan de Entrenamiento">
            <form onSubmit={handleAssign}>
                <div className="py-4">
                    <div className="mb-4 p-4 bg-dark-700 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Cliente:</div>
                        <div className="font-semibold">
                            {cliente.user_id?.first_name} {cliente.user_id?.last_name}
                        </div>
                        <div className="text-sm text-gray-400">
                            {cliente.user_id?.email}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="label">Seleccionar Plan</label>
                        {loading ? (
                            <div className="text-sm text-gray-400">Cargando planes...</div>
                        ) : planes.length === 0 ? (
                            <div className="text-sm text-yellow-400">
                                No tienes planes activos. Crea un plan primero.
                            </div>
                        ) : (
                            <select
                                className="input"
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                required
                            >
                                <option value="">-- Seleccionar Plan --</option>
                                {planes.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.nombre} ({plan.duracion_dias} días)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedPlan && (() => {
                        const plan = planes.find(p => p.id === selectedPlan);
                        return plan && (
                            <div className="p-3 bg-dark-600 rounded-lg border border-dark-500">
                                <div className="text-sm text-gray-400 mb-2">Vista previa del plan:</div>
                                <div className="font-medium mb-1">{plan.nombre}</div>
                                {plan.descripcion && (
                                    <div className="text-sm text-gray-400 mb-2">{plan.descripcion}</div>
                                )}
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <span>📅 {plan.duracion_dias} días</span>
                                    <span>💪 {plan.ejercicios?.length || 0} ejercicios</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-dark-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!selectedPlan || saving || planes.length === 0}
                    >
                        {saving ? 'Asignando...' : 'Asignar Plan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignPlanModal;
