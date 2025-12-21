import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageCarousel from '../../components/ImageCarousel';
import { useAuth } from '../../contexts/AuthContext';
import { suscripcionService, planesIAService } from '../../api/directus';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

const MyPlanPage = () => {
    const { profile } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [planIA, setPlanIA] = useState(null);
    const [activePlan, setActivePlan] = useState(null); // The plan being displayed
    const [planType, setPlanType] = useState(null); // 'trainer' or 'ia'
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
        const [subscriptionData, planIAData] = await Promise.all([
            suscripcionService.getByCliente(profile.id),
            planesIAService.getActiveByCliente(profile.id)
        ]);

        setSubscription(subscriptionData);
        setPlanIA(planIAData);

        // Determine which plan to show (prioritize trainer plan if both exist)
        if (subscriptionData?.plan_id) {
            setActivePlan(subscriptionData.plan_id);
            setPlanType('trainer');
        } else if (planIAData) {
            setActivePlan(planIAData);
            setPlanType('ia');
        }

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

    if (!subscription && !planIA) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mi Plan</h1>
                    <p className="text-gray-400">Tu plan de entrenamiento</p>
                </div>
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2">No tienes un plan asignado</h3>
                        <p className="text-gray-400 mb-6">
                            Elige un tipo de plan para comenzar tu entrenamiento.
                        </p>
                        <Link
                            to="/cliente/elegir-plan"
                            className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                        >
                            Elegir Tipo de Plan →
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    // Get exercises based on plan type
    const ejercicios = planType === 'ia'
        ? (activePlan.ejercicios || []).map(ej => {
            console.log('[MyPlanPage] IA Exercise item:', ej);
            console.log('[MyPlanPage] ejercicio_id:', ej.ejercicio_id);
            return {
                ...ej,
                ejercicio_id: ej.ejercicio_id,
                // Map the junction table fields
                id: ej.id,
                series: ej.series,
                repeticiones: ej.repeticiones,
                duracion_minutos: ej.duracion_minutos,
                notas: ej.notas,
                dia: ej.dia,
                orden: ej.orden
            };
        })
        : (activePlan?.ejercicios || []);

    const totalExercises = ejercicios.length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mi Plan</h1>
                <p className="text-gray-400">Tu plan de entrenamiento personalizado</p>
            </div>

            {/* Plan Type Switcher */}
            {subscription && planIA && (
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => {
                            setActivePlan(subscription.plan_id);
                            setPlanType('trainer');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${planType === 'trainer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-dark-700 text-gray-400 hover:text-white'
                            }`}
                    >
                        👨‍🏫 Plan con Profesor
                    </button>
                    <button
                        onClick={() => {
                            setActivePlan(planIA);
                            setPlanType('ia');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${planType === 'ia'
                            ? 'bg-purple-600 text-white'
                            : 'bg-dark-700 text-gray-400 hover:text-white'
                            }`}
                    >
                        🤖 Plan IA
                    </button>
                </div>
            )}

            {/* Plan Header */}
            <Card className={`mb-6 ${planType === 'ia' ? '!bg-gradient-to-br from-purple-900/30 via-dark-800 to-purple-900/20 border-purple-500/30' : '!bg-gradient-to-br from-primary-900/30 via-dark-800 to-accent-900/20 border-primary-500/30'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl ${planType === 'ia' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-primary-500 to-accent-500'} flex items-center justify-center text-4xl flex-shrink-0`}>
                        {planType === 'ia' ? '🤖' : '💪'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl md:text-3xl font-bold">{activePlan.nombre}</h2>
                            <span className={`badge text-xs ${planType === 'ia'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}>
                                {planType === 'ia' ? 'Generado por IA' : 'Plan Entrenador'}
                            </span>
                        </div>
                        {activePlan.descripcion && (
                            <p className="text-gray-400 mb-3">{activePlan.descripcion}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                            {planType === 'trainer' && activePlan.duracion_dias && (
                                <span className="flex items-center gap-2 text-primary-400">
                                    <span>📅</span>
                                    {activePlan.duracion_dias} días
                                </span>
                            )}
                            {planType === 'ia' && (
                                <>
                                    <span className="flex items-center gap-2 text-purple-400">
                                        <span>📅</span>
                                        <span className="capitalize">{activePlan.duracion_tipo}</span>
                                    </span>
                                    <span className="flex items-center gap-2 text-purple-400">
                                        <span>🎯</span>
                                        <span className="capitalize">{activePlan.objetivo?.replace('_', ' ')}</span>
                                    </span>
                                    <span className="flex items-center gap-2 text-purple-400">
                                        <span>📊</span>
                                        <span className="capitalize">{activePlan.nivel_experiencia}</span>
                                    </span>
                                </>
                            )}
                            <span className="flex items-center gap-2 text-accent-400">
                                <span>🏋️</span>
                                {totalExercises} ejercicios
                            </span>
                            {planType === 'trainer' && subscription && (
                                <span className="flex items-center gap-2 text-green-400">
                                    <span>✓</span>
                                    Activo desde {new Date(subscription.fecha_inicio).toLocaleDateString('es-ES')}
                                </span>
                            )}
                            {planType === 'ia' && activePlan.fecha_generacion && (
                                <span className="flex items-center gap-2 text-green-400">
                                    <span>✓</span>
                                    Generado {new Date(activePlan.fecha_generacion).toLocaleDateString('es-ES')}
                                </span>
                            )}
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
                            <div
                                key={item.id || idx}
                                onClick={() => openExercise({ ...ejercicio, planData: item })}
                                className="bg-dark-800 border border-dark-600 rounded-xl p-4 cursor-pointer hover:border-primary-500/50 transition-all active:scale-[0.98] touch-manipulation"
                            >
                                <div className="flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl bg-dark-700 flex-shrink-0 overflow-hidden">
                                        {ejercicio.imagen_url_1 ? (
                                            <img
                                                src={ejercicio.imagen_url_1}
                                                alt={ejercicio.nombre}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">
                                                💪
                                            </div>
                                        )}
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
                                            {item.duracion_minutos && (
                                                <span className="bg-dark-700 px-2 py-0.5 rounded">
                                                    {item.duracion_minutos}min
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {(ejercicio.imagen_url_1 || ejercicio.imagen_url_2) && <span>📷 Imágenes</span>}
                                            {hasVideo && <span>🎥 Video</span>}
                                            {ejercicio.descripcion && <span>📝 Descripción</span>}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center text-gray-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
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
                    <div className="space-y-4">
                        {/* Images - Stack on mobile, side by side on desktop */}
                        <div className="space-y-3">
                            {selectedExercise.imagen_url_1 && (
                                <div className="rounded-xl overflow-hidden">
                                    <img
                                        src={selectedExercise.imagen_url_1}
                                        alt={`${selectedExercise.nombre} - Posición inicial`}
                                        className="w-full h-auto object-contain max-h-[50vh]"
                                    />
                                </div>
                            )}
                            {selectedExercise.imagen_url_2 && (
                                <div className="rounded-xl overflow-hidden">
                                    <img
                                        src={selectedExercise.imagen_url_2}
                                        alt={`${selectedExercise.nombre} - Posición final`}
                                        className="w-full h-auto object-contain max-h-[50vh]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Video */}
                        {selectedExercise.video_referencia && (
                            <div className="rounded-xl overflow-hidden">
                                <video
                                    src={getVideoUrl(selectedExercise.video_referencia?.id || selectedExercise.video_referencia)}
                                    controls
                                    className="w-full"
                                    playsInline
                                    poster={getImageUrl(selectedExercise.imagen_referencia?.id || selectedExercise.imagen_referencia)}
                                >
                                    Tu navegador no soporta video.
                                </video>
                            </div>
                        )}

                        {/* Exercise Stats - Bigger touch targets */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {selectedExercise.planData?.series && (
                                <div className="bg-primary-500/20 text-primary-400 px-4 py-3 rounded-xl text-center">
                                    <p className="text-3xl sm:text-4xl font-bold">{selectedExercise.planData.series}</p>
                                    <p className="text-sm mt-1">Series</p>
                                </div>
                            )}
                            {selectedExercise.planData?.repeticiones && (
                                <div className="bg-accent-500/20 text-accent-400 px-4 py-3 rounded-xl text-center">
                                    <p className="text-3xl sm:text-4xl font-bold">{selectedExercise.planData.repeticiones}</p>
                                    <p className="text-sm mt-1">Reps</p>
                                </div>
                            )}
                            {selectedExercise.planData?.duracion_minutos && (
                                <div className="bg-green-500/20 text-green-400 px-4 py-3 rounded-xl text-center">
                                    <p className="text-3xl sm:text-4xl font-bold">{selectedExercise.planData.duracion_minutos}</p>
                                    <p className="text-sm mt-1">Min</p>
                                </div>
                            )}
                            {selectedExercise.grupo_muscular && (
                                <div className="col-span-2 sm:col-span-3 bg-orange-500/20 text-orange-400 px-4 py-3 rounded-xl text-center">
                                    <p className="text-xl font-bold capitalize">{selectedExercise.grupo_muscular}</p>
                                    <p className="text-sm mt-1">Grupo Muscular</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {selectedExercise.descripcion && (
                            <div className="bg-dark-700/50 rounded-xl p-4">
                                <h4 className="font-semibold mb-2 text-gray-200 flex items-center gap-2">
                                    <span>📋</span> Descripción
                                </h4>
                                <p className="text-gray-300 leading-relaxed">{selectedExercise.descripcion}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        {selectedExercise.instrucciones && (
                            <div className="bg-dark-700/50 rounded-xl p-4">
                                <h4 className="font-semibold mb-2 text-gray-200 flex items-center gap-2">
                                    <span>✓</span> Instrucciones
                                </h4>
                                <p className="text-gray-300 leading-relaxed">{selectedExercise.instrucciones}</p>
                            </div>
                        )}

                        {/* Notes from trainer */}
                        {selectedExercise.planData?.notas && (
                            <div className="bg-primary-900/30 border border-primary-500/30 rounded-xl p-4">
                                <h4 className="font-semibold mb-2 text-primary-300 flex items-center gap-2">
                                    <span>💬</span> Notas de tu entrenador
                                </h4>
                                <p className="text-gray-200 leading-relaxed">{selectedExercise.planData.notas}</p>
                            </div>
                        )}

                        {/* Close button - Larger for mobile */}
                        <button
                            onClick={() => setShowExerciseModal(false)}
                            className="w-full btn btn-primary py-4 text-lg font-semibold"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyPlanPage;
