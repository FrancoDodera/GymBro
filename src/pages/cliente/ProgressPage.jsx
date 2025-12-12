import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { clienteService } from '../../api/directus';

const ProgressPage = () => {
    const { profile, user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            loadData();
        }
    }, [profile]);

    const loadData = async () => {
        setLoading(true);
        const data = await clienteService.getMySessions(profile.id);
        setSessions(data);
        setLoading(false);
    };

    // Calculate stats
    const totalHours = sessions.reduce((sum, s) => sum + (parseFloat(s.horas_entrenadas) || 0), 0);
    const totalSessions = sessions.length;

    // Level system - 10 hours = 1 level, max 100
    const xpPerHour = 100;
    const totalXP = Math.round(totalHours * xpPerHour);
    const xpPerLevel = 1000;
    const currentLevel = Math.floor(totalXP / xpPerLevel) + 1;
    const xpInCurrentLevel = totalXP % xpPerLevel;
    const xpProgress = (xpInCurrentLevel / xpPerLevel) * 100;

    // Calculate streak
    const calculateStreak = () => {
        if (sessions.length === 0) return 0;

        const sortedDates = [...new Set(sessions.map(s => s.fecha))].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if trained today or yesterday
        if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

        let streak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = new Date(sortedDates[i]);
            const next = new Date(sortedDates[i + 1]);
            const diffDays = (current - next) / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };
    const currentStreak = calculateStreak();

    // Weekly goal (4 sessions per week)
    const weeklyGoal = 4;
    const thisWeekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.fecha);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return sessionDate >= startOfWeek;
    }).length;
    const weeklyProgress = Math.min((thisWeekSessions / weeklyGoal) * 100, 100);

    // Achievements
    const achievements = [
        { id: 1, name: 'Primera Sesión', desc: 'Registra tu primera sesión', icon: '🌟', unlocked: totalSessions >= 1 },
        { id: 2, name: 'Semana Completa', desc: 'Entrena 4 días en una semana', icon: '📅', unlocked: thisWeekSessions >= 4 },
        { id: 3, name: 'Guerrero', desc: 'Alcanza racha de 7 días', icon: '🔥', unlocked: currentStreak >= 7 },
        { id: 4, name: '10 Horas', desc: 'Acumula 10 horas de entrenamiento', icon: '⏱️', unlocked: totalHours >= 10 },
        { id: 5, name: 'Dedicación', desc: '25 sesiones totales', icon: '💪', unlocked: totalSessions >= 25 },
        { id: 6, name: 'Maratonista', desc: '50 horas de entrenamiento', icon: '🏃', unlocked: totalHours >= 50 },
        { id: 7, name: 'Leyenda', desc: 'Alcanza nivel 10', icon: '👑', unlocked: currentLevel >= 10 },
        { id: 8, name: 'Imparable', desc: 'Racha de 30 días', icon: '⚡', unlocked: currentStreak >= 30 },
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Calendar heatmap (last 35 days)
    const generateCalendarData = () => {
        const days = [];
        const today = new Date();

        for (let i = 34; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const sessionsOnDay = sessions.filter(s => s.fecha === dateStr);
            const hoursOnDay = sessionsOnDay.reduce((sum, s) => sum + (s.horas_entrenadas || 0), 0);

            days.push({
                date: dateStr,
                day: date.getDate(),
                dayName: date.toLocaleDateString('es', { weekday: 'short' }).charAt(0).toUpperCase(),
                hours: hoursOnDay,
                sessions: sessionsOnDay.length
            });
        }
        return days;
    };
    const calendarData = generateCalendarData();

    // Motivational quotes
    const quotes = [
        "El único mal entrenamiento es el que no hiciste. 💪",
        "Tu único límite eres tú mismo. 🚀",
        "Cada repetición te acerca a tu mejor versión. ⭐",
        "La disciplina pesa gramos, el arrepentimiento pesa toneladas. 🎯",
        "El dolor que sientes hoy será la fuerza que sentirás mañana. 🔥"
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];

    // Level titles
    const getLevelTitle = (level) => {
        if (level >= 50) return 'Leyenda del Gym';
        if (level >= 40) return 'Maestro Fitness';
        if (level >= 30) return 'Atleta Elite';
        if (level >= 20) return 'Guerrero del Hierro';
        if (level >= 15) return 'Campeón';
        if (level >= 10) return 'Veterano';
        if (level >= 5) return 'Entusiasta';
        if (level >= 3) return 'Aprendiz';
        return 'Novato';
    };

    if (loading) {
        return <LoadingSpinner message="Cargando tu progreso..." />;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header with Level */}
            <div className="relative mb-8 overflow-hidden">
                <Card className="!p-0 !bg-gradient-to-br from-primary-900/50 via-dark-800 to-accent-900/30 border-primary-500/30">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Level Badge */}
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                                    <div className="w-24 h-24 rounded-full bg-dark-800 flex flex-col items-center justify-center">
                                        <span className="text-xs text-gray-400 uppercase tracking-wide">Nivel</span>
                                        <span className="text-4xl font-bold text-gradient">{currentLevel}</span>
                                    </div>
                                </div>
                                {/* Streak badge */}
                                {currentStreak > 0 && (
                                    <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        🔥 {currentStreak}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold font-display mb-1">
                                    {user?.first_name} {user?.last_name}
                                </h1>
                                <p className="text-xl text-primary-400 font-semibold mb-3">
                                    {getLevelTitle(currentLevel)}
                                </p>

                                {/* XP Bar */}
                                <div className="max-w-md mx-auto md:mx-0">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">XP: {xpInCurrentLevel}</span>
                                        <span className="text-gray-400">{xpPerLevel}</span>
                                    </div>
                                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${xpProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {xpPerLevel - xpInCurrentLevel} XP para nivel {currentLevel + 1}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-dark-700/50 rounded-xl p-4">
                                    <p className="text-2xl font-bold text-green-400">{totalHours.toFixed(1)}h</p>
                                    <p className="text-xs text-gray-400">Total Horas</p>
                                </div>
                                <div className="bg-dark-700/50 rounded-xl p-4">
                                    <p className="text-2xl font-bold text-accent-400">{totalSessions}</p>
                                    <p className="text-xs text-gray-400">Sesiones</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Motivational Quote */}
            <Card className="mb-6 !bg-gradient-to-r from-dark-800 to-dark-750 border-dark-600">
                <p className="text-center text-lg italic text-gray-300">
                    "{dailyQuote}"
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Weekly Goal */}
                <Card header={<h3 className="text-lg font-semibold">🎯 Meta Semanal</h3>}>
                    <div className="text-center py-4">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-dark-600"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${weeklyProgress * 3.52} 352`}
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{thisWeekSessions}</span>
                                <span className="text-sm text-gray-400">de {weeklyGoal}</span>
                            </div>
                        </div>
                        <p className="text-gray-400">
                            {thisWeekSessions >= weeklyGoal
                                ? '🎉 ¡Meta cumplida!'
                                : `${weeklyGoal - thisWeekSessions} sesión(es) más para completar`
                            }
                        </p>
                    </div>
                </Card>

                {/* Streak */}
                <Card header={<h3 className="text-lg font-semibold">🔥 Racha Actual</h3>}>
                    <div className="text-center py-4">
                        <div className="text-6xl mb-4">
                            {currentStreak > 0 ? '🔥' : '❄️'}
                        </div>
                        <p className="text-5xl font-bold text-orange-400 mb-2">{currentStreak}</p>
                        <p className="text-gray-400">
                            {currentStreak === 0
                                ? '¡Entrena hoy para iniciar tu racha!'
                                : currentStreak === 1
                                    ? 'día consecutivo'
                                    : 'días consecutivos'
                            }
                        </p>
                        {currentStreak >= 7 && (
                            <div className="mt-4 inline-block bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm">
                                ¡Increíble! Sigue así 💪
                            </div>
                        )}
                    </div>
                </Card>

                {/* Total XP */}
                <Card header={<h3 className="text-lg font-semibold">⚡ Experiencia Total</h3>}>
                    <div className="text-center py-4">
                        <div className="text-6xl mb-4">⚡</div>
                        <p className="text-5xl font-bold text-primary-400 mb-2">{totalXP.toLocaleString()}</p>
                        <p className="text-gray-400">puntos de experiencia</p>
                        <p className="text-sm text-gray-500 mt-2">
                            +{xpPerHour} XP por cada hora entrenada
                        </p>
                    </div>
                </Card>
            </div>

            {/* Activity Calendar */}
            <Card className="mb-6" header={<h3 className="text-lg font-semibold">📅 Actividad de los últimos 35 días</h3>}>
                <div className="flex flex-wrap gap-1 justify-center py-4">
                    {calendarData.map((day, idx) => (
                        <div
                            key={idx}
                            title={`${day.date}: ${day.hours}h`}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all cursor-default
                                ${day.hours === 0
                                    ? 'bg-dark-700 text-gray-600'
                                    : day.hours < 1
                                        ? 'bg-primary-900 text-primary-300'
                                        : day.hours < 2
                                            ? 'bg-primary-700 text-white'
                                            : 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                }
                            `}
                        >
                            {day.day}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-dark-700" />
                        <span>Sin actividad</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-primary-900" />
                        <span>&lt;1h</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-primary-700" />
                        <span>1-2h</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-primary-500" />
                        <span>2h+</span>
                    </div>
                </div>
            </Card>

            {/* Achievements */}
            <Card header={
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">🏆 Logros</h3>
                    <span className="text-sm text-gray-400">{unlockedCount}/{achievements.length} desbloqueados</span>
                </div>
            }>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    {achievements.map((achievement) => (
                        <div
                            key={achievement.id}
                            className={`p-4 rounded-xl text-center transition-all ${achievement.unlocked
                                ? 'bg-gradient-to-br from-primary-900/50 to-accent-900/30 border border-primary-500/30'
                                : 'bg-dark-700/50 opacity-50 grayscale'
                                }`}
                        >
                            <div className={`text-4xl mb-2 ${achievement.unlocked ? '' : 'opacity-30'}`}>
                                {achievement.unlocked ? achievement.icon : '🔒'}
                            </div>
                            <p className="font-semibold text-sm mb-1">{achievement.name}</p>
                            <p className="text-xs text-gray-500">{achievement.desc}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default ProgressPage;
