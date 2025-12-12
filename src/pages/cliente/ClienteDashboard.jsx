import { React, useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { clienteService, suscripcionService } from '../../api/directus';
import { calculateStreak, getMotivationalMessage, getWeeklyStats } from '../../utils/helpers';
import ProgressChart from '../../components/ProgressChart';

const ClienteDashboard = () => {
    const { profile, user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);

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
                    </div>

                    {subscription.plan_id.ejercicios && subscription.plan_id.ejercicios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subscription.plan_id.ejercicios
                                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                .map((ejercicio, index) => (
                                    <div
                                        key={ejercicio.id}
                                        className="bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-primary-500 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-semibold text-lg flex-1">{ejercicio.nombre}</h4>
                                            <span className="badge badge-secondary text-xs ml-2">
                                                #{ejercicio.orden || index + 1}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            {ejercicio.series && (
                                                <div className="flex items-center text-sm">
                                                    <span className="text-gray-400 w-20">Series:</span>
                                                    <span className="font-medium text-primary-400">{ejercicio.series}</span>
                                                </div>
                                            )}
                                            {ejercicio.repeticiones && (
                                                <div className="flex items-center text-sm">
                                                    <span className="text-gray-400 w-20">Reps:</span>
                                                    <span className="font-medium text-accent-400">{ejercicio.repeticiones}</span>
                                                </div>
                                            )}
                                            {ejercicio.duracion_minutos && (
                                                <div className="flex items-center text-sm">
                                                    <span className="text-gray-400 w-20">Duración:</span>
                                                    <span className="font-medium text-green-400">{ejercicio.duracion_minutos} min</span>
                                                </div>
                                            )}
                                        </div>

                                        {ejercicio.descripcion && (
                                            <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                                                {ejercicio.descripcion}
                                            </p>
                                        )}

                                        {ejercicio.ejercicio_id?.imagen_referencia && (
                                            <div className="mt-3">
                                                <img
                                                    src={`${import.meta.env.VITE_DIRECTUS_URL}/assets/${ejercicio.ejercicio_id.imagen_referencia}`}
                                                    alt={ejercicio.nombre}
                                                    className="w-full h-32 object-cover rounded"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
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
        </div>
    );
};

export default ClienteDashboard;
