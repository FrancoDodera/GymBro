import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageCarousel from '../../components/ImageCarousel';
import { useAuth } from '../../contexts/AuthContext';
import { suscripcionService } from '../../api/directus';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

const MyPlanPage = () => {
    const { profile } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            loadPlan();
        }
    }, [profile]);

    const loadPlan = async () => {
        setLoading(true);
        const data = await suscripcionService.getByCliente(profile.id);
        setSubscription(data);
        setLoading(false);
    };

    const openExercise = (ejercicio) => {
        setSelectedExercise(ejercicio);
        setShowExerciseModal(true);
    };

    const getImageUrl = (imageId) => {
        if (!imageId) return null;
        return `${directusUrl}/assets/${imageId}?fit=cover&width=600&quality=80`;
    };

    const getVideoUrl = (videoId) => {
        if (!videoId) return null;
        return `${directusUrl}/assets/${videoId}`;
    };

    if (loading) {
        return <LoadingSpinner message="Cargando tu plan..." />;
    }

    if (!subscription || !subscription.plan_id) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mi Plan</h1>
                    <p className="text-gray-400">Tu plan de entrenamiento asignado</p>
                </div>
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2">No tienes un plan asignado</h3>
                        <p className="text-gray-400">
                            Tu entrenador te asignará un plan de entrenamiento pronto.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    const plan = subscription.plan_id;
    const ejercicios = plan.ejercicios || [];

    // Group exercises by some logic or just show list
    const totalExercises = ejercicios.length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mi Plan</h1>
                <p className="text-gray-400">Tu plan de entrenamiento personalizado</p>
            </div>

            {/* Plan Header */}
            <Card className="mb-6 !bg-gradient-to-br from-primary-900/30 via-dark-800 to-accent-900/20 border-primary-500/30">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-4xl flex-shrink-0">
                        💪
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{plan.nombre}</h2>
                        {plan.descripcion && (
                            <p className="text-gray-400 mb-3">{plan.descripcion}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-2 text-primary-400">
                                <span>📅</span>
                                {plan.duracion_dias ? `${plan.duracion_dias} días` : 'Sin duración definida'}
                            </span>
                            <span className="flex items-center gap-2 text-accent-400">
                                <span>🏋️</span>
                                {totalExercises} ejercicios
                            </span>
                            <span className="flex items-center gap-2 text-green-400">
                                <span>✓</span>
                                Activo desde {new Date(subscription.fecha_inicio).toLocaleDateString('es-ES')}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Exercises */}
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🏋️</span> Ejercicios del Plan
            </h3>

            {ejercicios.length === 0 ? (
                <Card>
                    <div className="text-center py-8">
                        <p className="text-gray-400">Este plan aún no tiene ejercicios asignados.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ejercicios.map((item, idx) => {
                        // Support both structures:
                        // 1. ejercicio_id reference (normalized)
                        // 2. Data directly in junction table (denormalized)
                        const ejercicio = item.ejercicio_id || item;

                        const hasImage = ejercicio.imagen_referencia;
                        const hasVideo = ejercicio.video_referencia;

                        return (
                            <Card
                                key={item.id || idx}
                                className="cursor-pointer hover:border-primary-500/50 transition-all hover:scale-[1.02]"
                                onClick={() => openExercise({ ...ejercicio, planData: item })}
                            >
                                <div className="flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl bg-dark-700 flex-shrink-0 overflow-hidden">
                                        <ImageCarousel
                                            images={[ejercicio.imagen_url_1, ejercicio.imagen_url_2]}
                                            alt={ejercicio.nombre}
                                            className="h-full w-full"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-lg mb-1 truncate">{ejercicio.nombre}</h4>

                                        <div className="flex flex-wrap gap-2 text-sm text-gray-400 mb-2">
                                            {item.series && (
                                                <span className="bg-dark-700 px-2 py-0.5 rounded">
                                                    {item.series} series
                                                </span>
                                            )}
                                            {item.repeticiones && (
                                                <span className="bg-dark-700 px-2 py-0.5 rounded">
                                                    {item.repeticiones} reps
                                                </span>
                                            )}
                                            {item.duracion_segundos && (
                                                <span className="bg-dark-700 px-2 py-0.5 rounded">
                                                    {item.duracion_segundos}s
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {hasImage && <span>📷 Imagen</span>}
                                            {hasVideo && <span>🎥 Video</span>}
                                            {ejercicio.descripcion && <span>📝 Descripción</span>}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center text-gray-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Exercise Detail Modal */}
            <Modal
                isOpen={showExerciseModal}
                onClose={() => setShowExerciseModal(false)}
                title={selectedExercise?.nombre || 'Ejercicio'}
            >
                {selectedExercise && (
                    <div className="py-4 max-h-[70vh] overflow-y-auto">
                        {/* Image Carousel */}
                        {(selectedExercise.imagen_url_1 || selectedExercise.imagen_url_2) && (
                            <div className="mb-4 rounded-xl overflow-hidden h-96">
                                <ImageCarousel
                                    images={[
                                        selectedExercise.imagen_url_1,
                                        selectedExercise.imagen_url_2
                                    ]}
                                    alt={selectedExercise.nombre}
                                    className="h-full w-full"
                                />
                            </div>
                        )}

                        {/* Video */}
                        {selectedExercise.video_referencia && (
                            <div className="mb-4 rounded-xl overflow-hidden">
                                <video
                                    src={getVideoUrl(selectedExercise.video_referencia?.id || selectedExercise.video_referencia)}
                                    controls
                                    className="w-full"
                                    poster={getImageUrl(selectedExercise.imagen_referencia?.id || selectedExercise.imagen_referencia)}
                                >
                                    Tu navegador no soporta video.
                                </video>
                            </div>
                        )}

                        {/* Exercise info */}
                        <div className="flex flex-wrap gap-3 mb-4">
                            {selectedExercise.planData?.series && (
                                <div className="bg-primary-500/20 text-primary-400 px-4 py-2 rounded-lg text-center">
                                    <p className="text-2xl font-bold">{selectedExercise.planData.series}</p>
                                    <p className="text-xs">Series</p>
                                </div>
                            )}
                            {selectedExercise.planData?.repeticiones && (
                                <div className="bg-accent-500/20 text-accent-400 px-4 py-2 rounded-lg text-center">
                                    <p className="text-2xl font-bold">{selectedExercise.planData.repeticiones}</p>
                                    <p className="text-xs">Repeticiones</p>
                                </div>
                            )}
                            {selectedExercise.planData?.duracion_segundos && (
                                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-center">
                                    <p className="text-2xl font-bold">{selectedExercise.planData.duracion_segundos}</p>
                                    <p className="text-xs">Segundos</p>
                                </div>
                            )}
                            {selectedExercise.grupo_muscular && (
                                <div className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-lg text-center">
                                    <p className="text-lg font-bold capitalize">{selectedExercise.grupo_muscular}</p>
                                    <p className="text-xs">Músculo</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {selectedExercise.descripcion && (
                            <div className="mb-4">
                                <h4 className="font-semibold mb-2 text-gray-300">Descripción</h4>
                                <p className="text-gray-400 whitespace-pre-wrap">{selectedExercise.descripcion}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        {selectedExercise.instrucciones && (
                            <div className="mb-4">
                                <h4 className="font-semibold mb-2 text-gray-300">Instrucciones</h4>
                                <p className="text-gray-400 whitespace-pre-wrap">{selectedExercise.instrucciones}</p>
                            </div>
                        )}

                        {/* Notes from plan */}
                        {selectedExercise.planData?.notas && (
                            <div className="bg-dark-700 rounded-lg p-4">
                                <h4 className="font-semibold mb-2 text-primary-400">📝 Notas de tu entrenador</h4>
                                <p className="text-gray-300">{selectedExercise.planData.notas}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-dark-700">
                    <button
                        onClick={() => setShowExerciseModal(false)}
                        className="btn btn-primary"
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default MyPlanPage;
