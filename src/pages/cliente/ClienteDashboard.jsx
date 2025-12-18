import { React, useState, useEffect } from 'react';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { clienteService, suscripcionService } from '../../api/directus';
import { calculateStreak, getMotivationalMessage, getWeeklyStats } from '../../utils/helpers';
import ProgressChart from '../../components/ProgressChart';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

const ClienteDashboard = () => {
    const { profile, user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);

    useEffect(() => {
        if (profile) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [profile]);

    const loadData = async () => {
        setLoading(true);
        const [sessionsData, subscriptionData] = await Promise.all([
            clienteService.getMySessions(profile.id),
            suscripcionService.getByCliente(profile.id)
        ]);

        setSessions(sessionsData);
        setSubscription(subscriptionData);
        setStreak(calculateStreak(sessionsData));
        setLoading(false);
    };

    if (loading) {
        return <LoadingSpinner message="Cargando tu dashboard..." />;
    }

    if (!profile) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center py-16">
                    <h1 className="text-3xl font-bold text-gradient mb-4">¡Bienvenido!</h1>
                    <p className="text-gray-400 mb-4">Tu perfil de cliente aún no está configurado.</p>
                    <p className="text-gray-500">Contacta a tu administrador o entrenador para completar tu registro.</p>
                </div>
            </div>
        );
    }

    const weeklyStats = getWeeklyStats(sessions);
    const motivationalMsg = getMotivationalMessage(streak);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                    ¡Bienvenido, {profile?.user_id?.first_name}!
                </h1>
                <p className="text-gray-400">Sigue entrenando y alcanza tus objetivos 💪</p>
            </div>

            {/* Streak & Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="stat-card bg-gradient-to-br from-primary-500/20 to-primary-700/10 border-primary-500/30">
                    <div className="text-center">
                        <div className="text-5xl mb-2">🔥</div>
                        <p className="stat-value text-primary-400">{streak}</p>
                        <p className="stat-label">Días Consecutivos</p>
                        <p className="text-sm text-primary-300 mt-2">{motivationalMsg}</p>
                    </div>
                </Card>

                <Card className="stat-card bg-gradient-to-br from-accent-500/20 to-accent-700/10 border-accent-500/30">
                    <div className="text-center">
                        <div className="text-5xl mb-2">⏱️</div>
                        <p className="stat-value text-accent-400">{weeklyStats.totalHours.toFixed(1)}h</p>
                        <p className="stat-label">Horas Esta Semana</p>
                    </div>
                </Card>

                <Card className="stat-card bg-gradient-to-br from-green-500/20 to-green-700/10 border-green-500/30">
                    <div className="text-center">
                        <div className="text-5xl mb-2">💪</div>
                        <p className="stat-value text-green-400">{weeklyStats.sessionCount}</p>
                        <p className="stat-label">Sesiones Esta Semana</p>
                    </div>
                </Card>
            </div>

            {/* Progress Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card header={<h2 className="text-xl font-bold">Progreso de Entrenamiento</h2>}>
                    {sessions.length > 0 ? (
                        <ProgressChart sessions={sessions} type="line" />
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>No hay datos de entrenamiento aún</p>
                            <p className="text-sm mt-2">¡Registra tu primera sesión!</p>
                        </div>
                    )}
                </Card>

                {/* Subscription Status */}
                <Card header={<h2 className="text-xl font-bold">Mi Suscripción</h2>}>
                    {subscription ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400">Plan Actual</p>
                                <p className="text-2xl font-bold text-primary-400">{subscription.plan_id?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Descripción</p>
                                <p className="text-gray-300">{subscription.plan_id?.descripcion || 'Sin descripción'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Inicio</p>
                                    <p className="font-medium">{new Date(subscription.fecha_inicio).toLocaleDateString('es-ES')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Estado</p>
                                    <span className={`badge ${subscription.habilitado ? 'badge-success' : 'badge-danger'}`}>
                                        {subscription.habilitado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>No tienes una suscripción activa</p>
                            <p className="text-sm mt-2">Contacta a tu entrenador</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Training Plan Section */}
            {subscription?.plan_id && (
                <Card
                    header={
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">📋 Mi Plan de Entrenamiento</h2>
                            <span className="badge badge-primary">{subscription.plan_id.duracion_dias} días</span>
                        </div>
                    }
                    className="mb-8"
                >
                    <div className="mb-6 pb-4 border-b border-dark-700">
                        <h3 className="text-xl font-semibold text-primary-400 mb-2">
                            {subscription.plan_id.nombre}
                        </h3>
                        {subscription.plan_id.descripcion && (
                            <p className="text-gray-400">{subscription.plan_id.descripcion}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">Tnes que entrenar!</p>
                    </div>

                    {subscription.plan_id.ejercicios && subscription.plan_id.ejercicios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subscription.plan_id.ejercicios
                                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                .map((ejercicioPlan, index) => {
                                    // Get exercise data from ejercicio_id or fallback to plan data
                                    const ejercicio = ejercicioPlan.ejercicio_id || ejercicioPlan;
                                    const nombre = ejercicio.nombre || `Ejercicio ${index + 1}`;
                                    const imagen = ejercicio.imagen_url_1 || ejercicio.imagen_referencia;

                                    return (
                                        <div
                                            key={ejercicioPlan.id || index}
                                            onClick={() => {
                                                setSelectedExercise({ ...ejercicio, planData: ejercicioPlan });
                                                setShowExerciseModal(true);
                                            }}
                                            className="bg-dark-700 rounded-lg overflow-hidden border border-dark-600 hover:border-primary-500 transition-all cursor-pointer hover:scale-[1.02]"
                                        >
                                            {/* Image Thumbnail */}
                                            {imagen && (
                                                <div className="relative h-32 bg-dark-800">
                                                    <img
                                                        src={imagen}
                                                        alt={nombre}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-2 right-2">
                                                        <span className="badge badge-secondary text-xs">
                                                            #{ejercicioPlan.orden ?? index + 1}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-4">
                                                <h4 className="font-semibold text-lg mb-3">{nombre}</h4>

                                                <div className="space-y-2">
                                                    {ejercicioPlan.series && (
                                                        <div className="flex items-center text-sm">
                                                            <span className="text-gray-400 w-20">Series:</span>
                                                            <span className="font-medium text-primary-400">{ejercicioPlan.series}</span>
                                                        </div>
                                                    )}
                                                    {ejercicioPlan.repeticiones && (
                                                        <div className="flex items-center text-sm">
                                                            <span className="text-gray-400 w-20">Reps:</span>
                                                            <span className="font-medium text-accent-400">{ejercicioPlan.repeticiones}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>Este plan no tiene ejercicios asignados todavía</p>
                            <p className="text-sm mt-2">Contacta a tu entrenador</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Recent Sessions */}
            <Card header={<h2 className="text-xl font-bold">Últimas Sesiones</h2>}>
                {sessions.length > 0 ? (
                    <div className="space-y-3">
                        {sessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                                <div>
                                    <p className="font-medium">{session.tipo_entrenamiento}</p>
                                    <p className="text-sm text-gray-400">
                                        {new Date(session.fecha).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary-400">{session.horas_entrenadas}h</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p>No hay sesiones registradas</p>
                    </div>
                )}
            </Card>

            {/* Exercise Detail Modal */}
            <Modal
                isOpen={showExerciseModal}
                onClose={() => setShowExerciseModal(false)}
                title={selectedExercise?.nombre || 'Ejercicio'}
            >
                {selectedExercise && (
                    <div className="py-4 max-h-[70vh] overflow-y-auto">
                        {/* Images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {selectedExercise.imagen_url_1 && (
                                <div className="rounded-xl overflow-hidden h-64">
                                    <img
                                        src={selectedExercise.imagen_url_1}
                                        alt={`${selectedExercise.nombre} - Imagen 1`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            {selectedExercise.imagen_url_2 && (
                                <div className="rounded-xl overflow-hidden h-64">
                                    <img
                                        src={selectedExercise.imagen_url_2}
                                        alt={`${selectedExercise.nombre} - Imagen 2`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

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
                            {selectedExercise.planData?.duracion_minutos && (
                                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-center">
                                    <p className="text-2xl font-bold">{selectedExercise.planData.duracion_minutos}</p>
                                    <p className="text-xs">Minutos</p>
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

export default ClienteDashboard;
