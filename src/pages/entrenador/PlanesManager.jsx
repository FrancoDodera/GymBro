import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { planesService } from '../../api/directus';

const PlanesManager = () => {
    const { profile } = useAuth();
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);

    useEffect(() => {
        loadPlanes();
    }, []);

    const loadPlanes = async () => {
        setLoading(true);
        const data = await planesService.getAllWithExercises();
        setPlanes(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (planToDelete) {
            await planesService.delete(planToDelete.id);
            setShowDeleteModal(false);
            setPlanToDelete(null);
            loadPlanes();
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando planes..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                        Mis Planes de Entrenamiento
                    </h1>
                    <p className="text-gray-400">Crea y gestiona planes para tus clientes</p>
                </div>
                <Link to="/entrenador/planes/nuevo" className="btn btn-primary">
                    + Crear Plan
                </Link>
            </div>

            {planes.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2">No tienes planes creados</h3>
                        <p className="text-gray-400 mb-6">Crea tu primer plan de entrenamiento</p>
                        <Link to="/entrenador/planes/nuevo" className="btn btn-primary">
                            Crear Plan
                        </Link>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planes.map((plan) => (
                        <Card key={plan.id} className="hover:border-primary-500/50 transition-colors">
                            <div className="flex flex-col h-full">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{plan.nombre}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {plan.descripcion || 'Sin descripcion'}
                                    </p>

                                    <div className="flex gap-4 text-sm text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <span>💪</span>
                                            {plan.ejercicios?.length || 0} ejercicios
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span>📅</span>
                                            {plan.duracion_dias || '?'} dias
                                        </span>
                                    </div>

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
                                                    +{plan.ejercicios.length - 3} mas...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${plan.activo ? 'badge-success' : 'badge-danger'}`}>
                                            {plan.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
                                    <Link
                                        to={`/entrenador/planes/editar/${plan.id}`}
                                        className="btn btn-secondary text-sm flex-1"
                                    >
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setPlanToDelete(plan);
                                            setShowDeleteModal(true);
                                        }}
                                        className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmar Eliminacion"
            >
                <div className="py-4">
                    <p className="text-gray-300">
                        ¿Estas seguro de eliminar el plan "{planToDelete?.nombre}"?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Esta accion no se puede deshacer.
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

export default PlanesManager;
