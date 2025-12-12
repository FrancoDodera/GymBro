import React, { useState, useEffect, useCallback } from 'react';

const SessionTimer = ({ onTimeChange, onComplete }) => {
    const STORAGE_KEY = 'activeWorkoutSession';

    const [timerState, setTimerState] = useState({
        isRunning: false,
        isPaused: false,
        startTime: null,
        elapsedSeconds: 0,
        pausedAt: null
    });

    const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

    // Load saved session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem(STORAGE_KEY);
        if (savedSession) {
            try {
                const data = JSON.parse(savedSession);
                const now = Date.now();
                const elapsed = Math.floor((now - data.startTime) / 1000);

                setShowRecoveryBanner(true);
                setTimerState({
                    isRunning: false,
                    isPaused: true,
                    startTime: data.startTime,
                    elapsedSeconds: elapsed,
                    pausedAt: now
                });
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Timer interval
    useEffect(() => {
        if (!timerState.isRunning) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime) / 1000);
            setTimerState(prev => ({ ...prev, elapsedSeconds: elapsed }));

            // Notify parent of time change
            if (onTimeChange) {
                onTimeChange(elapsed / 3600); // Convert to hours
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerState.isRunning, timerState.startTime, onTimeChange]);

    const startTimer = useCallback(() => {
        const now = Date.now();
        const newState = {
            isRunning: true,
            isPaused: false,
            startTime: now,
            elapsedSeconds: 0,
            pausedAt: null
        };

        setTimerState(newState);
        setShowRecoveryBanner(false);

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            startTime: now
        }));
    }, []);

    const pauseTimer = useCallback(() => {
        const now = Date.now();
        setTimerState(prev => ({
            ...prev,
            isRunning: false,
            isPaused: true,
            pausedAt: now
        }));
    }, []);

    const resumeTimer = useCallback(() => {
        if (!timerState.pausedAt || !timerState.startTime) return;

        const pauseDuration = Date.now() - timerState.pausedAt;
        const newStartTime = timerState.startTime + pauseDuration;

        setTimerState(prev => ({
            ...prev,
            isRunning: true,
            isPaused: false,
            startTime: newStartTime,
            pausedAt: null
        }));

        // Update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            startTime: newStartTime
        }));
    }, [timerState.pausedAt, timerState.startTime]);

    const stopTimer = useCallback(() => {
        const hours = timerState.elapsedSeconds / 3600;
        const roundedHours = Math.round(hours * 100) / 100;

        setTimerState({
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsedSeconds: 0,
            pausedAt: null
        });

        localStorage.removeItem(STORAGE_KEY);

        if (onComplete) {
            onComplete(roundedHours);
        }
    }, [timerState.elapsedSeconds, onComplete]);

    const continueSession = useCallback(() => {
        setShowRecoveryBanner(false);
        resumeTimer();
    }, [resumeTimer]);

    const discardSession = useCallback(() => {
        setShowRecoveryBanner(false);
        setTimerState({
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsedSeconds: 0,
            pausedAt: null
        });
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Format time for display
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Format duration for display
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m ${seconds % 60}s`;
    };

    return (
        <div className="space-y-4">
            {/* Recovery Banner */}
            {showRecoveryBanner && (
                <div className="bg-accent-500/20 border border-accent-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⏱️</span>
                        <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">Sesión recuperada</p>
                            <p className="text-xs text-gray-300 mb-3">
                                Tienes una sesión activa desde hace {formatDuration(timerState.elapsedSeconds)}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={continueSession}
                                    className="text-xs px-3 py-1.5 bg-accent-600 hover:bg-accent-500 rounded-lg transition-colors"
                                >
                                    Continuar
                                </button>
                                <button
                                    onClick={discardSession}
                                    className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                                >
                                    Descartar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer Display */}
            <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-2xl p-8">
                <div className="text-center">
                    <div className="text-6xl md:text-7xl font-bold font-mono text-gradient mb-4">
                        {formatTime(timerState.elapsedSeconds)}
                    </div>

                    {timerState.isPaused && (
                        <p className="text-sm text-accent-400 mb-4">⏸ Pausado</p>
                    )}

                    {/* Timer Controls */}
                    <div className="flex justify-center gap-3">
                        {!timerState.isRunning && !timerState.isPaused && (
                            <button
                                onClick={startTimer}
                                className="btn btn-primary flex items-center gap-2 text-lg px-8 py-4"
                            >
                                <span>▶</span>
                                <span>Iniciar Entrenamiento</span>
                            </button>
                        )}

                        {timerState.isRunning && (
                            <>
                                <button
                                    onClick={pauseTimer}
                                    className="btn btn-secondary flex items-center gap-2 px-6"
                                >
                                    <span>⏸</span>
                                    <span>Pausar</span>
                                </button>
                                <button
                                    onClick={stopTimer}
                                    className="btn bg-red-600 hover:bg-red-500 flex items-center gap-2 px-6"
                                >
                                    <span>⏹</span>
                                    <span>Finalizar</span>
                                </button>
                            </>
                        )}

                        {timerState.isPaused && !showRecoveryBanner && (
                            <>
                                <button
                                    onClick={resumeTimer}
                                    className="btn btn-primary flex items-center gap-2 px-6"
                                >
                                    <span>▶</span>
                                    <span>Reanudar</span>
                                </button>
                                <button
                                    onClick={stopTimer}
                                    className="btn bg-red-600 hover:bg-red-500 flex items-center gap-2 px-6"
                                >
                                    <span>⏹</span>
                                    <span>Finalizar</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Duration Info */}
                    {timerState.elapsedSeconds > 0 && (
                        <div className="mt-4 pt-4 border-t border-dark-700">
                            <p className="text-sm text-gray-400">
                                Duración: {formatDuration(timerState.elapsedSeconds)}
                                {' '}
                                <span className="text-primary-400">
                                    ({(timerState.elapsedSeconds / 3600).toFixed(2)} horas)
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Helper Text */}
            {!timerState.isRunning && !timerState.isPaused && (
                <p className="text-xs text-center text-gray-500">
                    💡 El cronómetro se guardará automáticamente si cierras la app
                </p>
            )}
        </div>
    );
};

export default SessionTimer;
