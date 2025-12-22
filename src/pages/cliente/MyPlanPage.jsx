import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageCarousel from '../../components/ImageCarousel';
import { useAuth } from '../../contexts/AuthContext';
import { suscripcionService, planesIAService, authService } from '../../api/directus';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

const MyPlanPage = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [planIA, setPlanIA] = useState(null);
    const [activeTab, setActiveTab] = useState('trainer'); // 'trainer' or 'ia'
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
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

        // Auto-select tab based on what exists (prioritize trainer)
        if (subscriptionData?.plan_id) {
            setActiveTab('trainer');
        } else if (planIAData) {
            setActiveTab('ia');
        }

        setLoading(false);
    };

    const handleRequestTrainerPlan = async () => {
        try {
            setActionLoading(true);
            await authService.updatePlanPreference(profile.id, 'profesor');
            window.location.reload();
        } catch (error) {
            console.error('Error requesting trainer plan:', error);
            alert('Error al solicitar plan con entrenador');
            setActionLoading(false);
        }
    };

    const openExercise = (ejercicio) => {
        setSelectedExercise(ejercicio);
        setShowExerciseModal(true);
    };

    const closeExerciseModal = () => {
        setShowExerciseModal(false);
        setSelectedExercise(null);
    };

    const getImageUrl = (imageId) => {
        if (!imageId) return null;
        return `${directusUrl}/assets/${imageId}`;
    };

    const getVideoUrl = (videoId) => {
        if (!videoId) return null;
        return `${directusUrl}/assets/${videoId}`;
    };

    if (loading) {
        return <LoadingSpinner message="Cargando tu plan..." />;
    }

    // Get data based on active tab
    const activePlan = activeTab === 'trainer' ? subscription?.plan_id : planIA;
    const hasTrainerPlan = !!subscription?.plan_id;
    const hasIAPlan = !!planIA;
    const isWaitingForTrainer = profile?.tipo_plan_preferido === 'profesor' && !hasTrainerPlan;

    // Get exercises based on active tab
    const ejercicios = activeTab === 'ia' && planIA
        ? (planIA.ejercicios || []).map(ej => ({
            ...ej,
            ejercicio_id: ej.ejercicio_id,
            id: ej.id,
            series: ej.series,
            repeticiones: ej.repeticiones,
            duracion_minutos: ej.duracion_minutos,
            notas: ej.notas,
            dia: ej.dia,
            orden: ej.orden
        }))
        : (activePlan?.ejercicios || []);

    const totalExercises = ejercicios.length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mi Plan</h1>
                <p className="text-gray-400">Tu plan de entrenamiento personalizado</p>
            </div>

            {/* Tabs Switcher */}
            <div className="mb-6">
                <div className="flex gap-2 bg-dark-800 p-1 rounded-xl border border-dark-600 inline-flex">
                    <button
                        onClick={() => setActiveTab('trainer')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'trainer'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        👨‍🏫 Plan Entrenador
                        {hasTrainerPlan && <span className="ml-2 text-green-400">✓</span>}
                        {isWaitingForTrainer && <span className="ml-2 text-yellow-400">⏳</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('ia')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'ia'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🤖 Plan IA
                        {hasIAPlan && <span className="ml-2 text-green-400">✓</span>}
                    </button>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'trainer' ? (
                // Trainer Plan Tab
                hasTrainerPlan ? (
                    // Has trainer plan - show it
                    <>
                        {/* Plan Info Card */}
                        <Card className="mb-6 bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-500/30">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold text-white">
                                                {activePlan.nombre}
                                            </h2>
                                            <span className="bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-full">
                                                Plan con Entrenador
                                            </span>
                                        </div>
                                        {activePlan.descripcion && (
                                            <p className="text-gray-300 mt-2">{activePlan.descripcion}</p>
                                        )}
                                    </div>
                                </div>

                                {activePlan.entrenador_id && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>👤</span>
                                        <span>Asignado por {activePlan.entrenador_id.nombre || 'tu entrenador'}</span>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="text-blue-400">💪</span>
                                        <span>{totalExercises} ejercicios</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Exercises Section */}
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                🏋️ Ejercicios del Plan
                            </h3>

                            {totalExercises === 0 ? (
                                <Card>
                                    <div className="text-center py-8">
                                        <p className="text-gray-400">Este plan aún no tiene ejercicios asignados.</p>
                                    </div>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ejercicios.map((item, idx) => {
                                        const ejercicio = item.ejercicio_id || item;
                                        return (
                                            <div
                                                key={item.id || idx}
                                                onClick={() => openExercise({ ...ejercicio, planData: item })}
                                                className="bg-dark-800 border border-dark-600 rounded-xl p-4 cursor-pointer hover:border-primary-500/50 transition-all active:scale-[0.98] touch-manipulation"
                                            >
                                                <div className="flex gap-4">
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
                                                            {ejercicio.video_referencia && <span>🎥 Video</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : isWaitingForTrainer ? (
                    // Waiting for trainer assignment
                    <Card className="bg-blue-500/10 border-blue-500/30">
                        <div className="text-center p-8">
                            <div className="text-6xl mb-4">⏳</div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Esperando Asignación de Entrenador
                            </h3>
                            <p className="text-gray-300 mb-6">
                                Has solicitado un plan con entrenador profesional. Recibirás un plan personalizado pronto.
                            </p>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <p className="text-blue-300 text-sm">
                                    💡 <strong>Tip:</strong> Mientras esperas, puedes generar un plan con IA en la pestaña "Plan IA"
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    // No trainer plan - show option to request
                    <Card className="bg-blue-500/10 border-blue-500/30">
                        <div className="text-center p-8">
                            <div className="text-6xl mb-4">👨‍🏫</div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Plan con  Entrenador
                            </h3>
                            <p className="text-gray-300 mb-6">
                                Recibe un plan personalizado diseñado por un entrenador profesional.
                            </p>
                            <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span className="text-green-400">✅</span>
                                    <span>Seguimiento personalizado</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span className="text-green-400">✅</span>
                                    <span>Ajustes basados en tu progreso</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span className="text-green-400">✅</span>
                                    <span>Comunicación directa con entrenador</span>
                                </div>
                            </div>
                            <button
                                onClick={handleRequestTrainerPlan}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Solicitando...' : 'Solicitar Plan con Entrenador'}
                            </button>
                        </div>
                    </Card>
                )
            ) : (
                // AI Plan Tab
                hasIAPlan ? (
                    // Has AI plan - show it
                    <>
                        {/* Plan Info Card */}
                        <Card className="mb-6 bg-gradient-to-r from-purple-900/20 to-purple-800/10 border-purple-500/30">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-2xl font-bold text-white">
                                                {planIA.nombre}
                                            </h2>
                                            <span className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1 rounded-full">
                                                Generado por IA
                                            </span>
                                        </div>
                                        {planIA.descripcion && (
                                            <p className="text-gray-300 mt-2">{planIA.descripcion}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="text-purple-400">💪</span>
                                        <span>{totalExercises} ejercicios</span>
                                    </div>
                                    {planIA.objetivo && (
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <span className="text-purple-400">🎯</span>
                                            <span>Objetivo: {planIA.objetivo.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                    {planIA.nivel_experiencia && (
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <span className="text-purple-400">📊</span>
                                            <span>Nivel: {planIA.nivel_experiencia}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <button
                                        onClick={() => navigate('/cliente/generar-plan-ia')}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
                                    >
                                        🔄 Regenerar Plan
                                    </button>
                                </div>
                            </div>
                        </Card>

                        {/* Exercises Section */}
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                🏋️ Ejercicios del Plan
                            </h3>

                            {totalExercises === 0 ? (
                                <Card>
                                    <div className="text-center py-8">
                                        <p className="text-gray-400">Este plan aún no tiene ejercicios asignados.</p>
                                    </div>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ejercicios.map((item, idx) => {
                                        const ejercicio = item.ejercicio_id || item;
                                        return (
                                            <div
                                                key={item.id || idx}
                                                onClick={() => openExercise({ ...ejercicio, planData: item })}
                                                className="bg-dark-800 border border-dark-600 rounded-xl p-4 cursor-pointer hover:border-primary-500/50 transition-all active:scale-[0.98] touch-manipulation"
                                            >
                                                <div className="flex gap-4">
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
                                                            {ejercicio.video_referencia && <span>🎥 Video</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // No AI plan - show option to generate
                    <Card className="bg-purple-500/10 border-purple-500/30">
                        <div className="text-center p-8">
                            <div className="text-6xl mb-4">🤖</div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Plan Generado por IA
                            </h3>
                            <p className="text-gray-300 mb-6">
                                Genera instantáneamente un plan de entrenamiento personalizado con inteligencia artificial.
                            </p>
                            <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span className="text-purple-400">⚡</span>
                                    <span>Generación instantánea</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span className="text-purple-400">🎯</span>
                                    <span>Adaptado a tus objetivos</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span className="text-purple-400">🔄</span>
                                    <span>Regenerable cuando quieras</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/cliente/generar-plan-ia')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                Generar Plan con IA
                            </button>
                        </div>
                    </Card>
                )
            )}

            {/* Exercise Detail Modal */}
            {showExerciseModal && selectedExercise && (
                <Modal onClose={closeExerciseModal}>
                    <div className="p-6 max-w-3xl">
                        <h2 className="text-3xl font-bold text-white mb-4">{selectedExercise.nombre}</h2>

                        {/* Plan data if available */}
                        {selectedExercise.planData && (
                            <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                                <h3 className="text-lg font-semibold text-primary-300 mb-2">Detalles del Plan</h3>
                                <div className="flex flex-wrap gap-4 text-gray-300">
                                    {selectedExercise.planData.series && (
                                        <div>
                                            <span className="text-gray-400">Series:</span>
                                            <span className="ml-2 font-semibold">{selectedExercise.planData.series}</span>
                                        </div>
                                    )}
                                    {selectedExercise.planData.repeticiones && (
                                        <div>
                                            <span className="text-gray-400">Repeticiones:</span>
                                            <span className="ml-2 font-semibold">{selectedExercise.planData.repeticiones}</span>
                                        </div>
                                    )}
                                    {selectedExercise.planData.duracion_minutos && (
                                        <div>
                                            <span className="text-gray-400">Duración:</span>
                                            <span className="ml-2 font-semibold">{selectedExercise.planData.duracion_minutos} min</span>
                                        </div>
                                    )}
                                </div>
                                {selectedExercise.planData.notas && (
                                    <p className="mt-3 text-gray-300 text-sm">
                                        <span className="text-gray-400">Notas:</span> {selectedExercise.planData.notas}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Exercise images */}
                        {(selectedExercise.imagen_url_1 || selectedExercise.imagen_url_2 || selectedExercise.imagen_referencia) && (
                            <ImageCarousel
                                images={[
                                    selectedExercise.imagen_url_1,
                                    selectedExercise.imagen_url_2,
                                    selectedExercise.imagen_referencia ? getImageUrl(selectedExercise.imagen_referencia) : null
                                ].filter(Boolean)}
                                alt={selectedExercise.nombre}
                            />
                        )}

                        {/* Exercise description */}
                        {selectedExercise.descripcion && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Descripción</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                    {selectedExercise.descripcion}
                                </p>
                            </div>
                        )}

                        {/* Exercise video */}
                        {selectedExercise.video_referencia && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Video de Referencia</h3>
                                <div className="relative pt-[56.25%] rounded-xl overflow-hidden bg-dark-700">
                                    <video
                                        controls
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={getVideoUrl(selectedExercise.video_referencia)}
                                    >
                                        Tu navegador no soporta el elemento de video.
                                    </video>
                                </div>
                            </div>
                        )}

                        {/* Exercise metadata */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {selectedExercise.categoria && (
                                <span className="bg-dark-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                                    {selectedExercise.categoria}
                                </span>
                            )}
                            {selectedExercise.nivel_dificultad && (
                                <span className="bg-dark-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                                    {selectedExercise.nivel_dificultad}
                                </span>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MyPlanPage;
