export const calculateStreak = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;

    const sortedSessions = sessions
        .map(s => new Date(s.fecha))
        .sort((a, b) => b - a);

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedSessions.length; i++) {
        const sessionDate = new Date(sortedSessions[i]);
        sessionDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);

        const diffDays = Math.floor((expectedDate - sessionDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            streak++;
        } else if (diffDays > 0) {
            break;
        }
    }

    return streak;
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatTime = (hours) => {
    if (!hours) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

export const getWeeklyStats = (sessions) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.fecha);
        return sessionDate >= sevenDaysAgo && sessionDate <= now;
    });

    const totalHours = weekSessions.reduce((sum, s) => sum + parseFloat(s.horas_entrenadas || 0), 0);
    const sessionCount = weekSessions.length;

    return { totalHours, sessionCount };
};

export const groupSessionsByWeek = (sessions) => {
    const grouped = {};

    sessions.forEach(session => {
        const date = new Date(session.fecha);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Sunday
        weekStart.setHours(0, 0, 0, 0);

        const weekKey = weekStart.toISOString().split('T')[0];

        if (!grouped[weekKey]) {
            grouped[weekKey] = {
                weekStart: weekStart,
                sessions: [],
                totalHours: 0
            };
        }

        grouped[weekKey].sessions.push(session);
        grouped[weekKey].totalHours += parseFloat(session.horas_entrenadas || 0);
    });

    return Object.values(grouped).sort((a, b) => a.weekStart - b.weekStart);
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const getMotivationalMessage = (streak) => {
    if (streak === 0) return "¡Comienza tu racha hoy! 💪";
    if (streak === 1) return "¡Buen comienzo! Sigue así 🔥";
    if (streak < 7) return `¡${streak} días seguidos! Vas genial 🚀`;
    if (streak < 30) return `¡${streak} días! Eres imparable 🌟`;
    return `¡${streak} días consecutivos! ¡LEYENDA! 👑`;
};
