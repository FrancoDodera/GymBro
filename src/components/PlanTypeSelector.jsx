import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/directus';
import Card from './Card';

const PlanTypeSelector = () => {
    const navigate = useNavigate();
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSelectTrainer = async () => {
        try {
            setLoading(true);
            setError(null);

            // Update preference in database
            await authService.updatePlanPreference(user.profile.id, 'profesor');

            // Update local user context
            await updateUserProfile();

            // Reload to show waiting state
            window.location.reload();
        } catch (err) {
            console.error('Error updating plan preference:', err);
            setError('Error al guardar tu preferencia. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAI = () => {
        navigate('/cliente/generar-plan-ia');
    };

    const handleChangePlanType = async () => {
        try {
            setLoading(true);
            setError(null);

            // Reset preference
            await authService.updatePlanPreference(user.profile.id, null);

            // Update local user context
            await updateUserProfile();

            // Reload to show selection again
            window.location.reload();
        } catch (err) {
            console.error('Error resetting plan preference:', err);
            setError('Error al cambiar tu preferencia. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Check if user already chose trainer plan but doesn't have one assigned
    const isWaitingForTrainer = user?.profile?.tipo_plan_preferido === 'profesor';

    if (isWaitingForTrainer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 flex items-center justify-center">
                <Card className="max-w-2xl w-full bg-white/5 border-white/10">
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4">⏳</div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Esperando Asignación de Entrenador
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Has solicitado un plan con entrenador profesional. Tu entrenador te asignará un plan personalizado pronto.
                        </p>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                            <p className="text-blue-300 text-sm">
                                💡 <strong>Tip:</strong> Recibirás una notificación cuando tu plan esté listo
                            </p>
                        </div>
                        {error && (
                            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                                {error}
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/cliente/dashboard')}
                                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                Volver al Dashboard
                            </button>
                            <button
                                onClick={handleChangePlanType}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Cambiando...' : 'Cambiar a Plan IA'}
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Elige tu Tipo de Plan
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Selecciona cómo quieres gestionar tu entrenamiento. Puedes cambiar tu elección en cualquier momento.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center max-w-2xl mx-auto">
                        {error}
                    </div>
                )}

                {/* Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Trainer Plan Card */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                        <div className="absolute insert-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 group-hover:opacity-20 transition-opacity" />

                        <div className="relative p-8">
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">👨‍🏫</div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                    Plan con Profesor
                                </h2>
                                <p className="text-gray-300">
                                    Recibe un plan personalizado diseñado por tu entrenador profesional.
                                </p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>✅ Seguimiento personalizado</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>✅ Ajustes basados en tu progreso</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>✅ Comunicación directa con entrenador</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>✅ Planes adaptados a tus objetivos específicos</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSelectTrainer}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Solicitar Asignación de Entrenador'}
                            </button>
                        </div>
                    </div>

                    {/* AI Plan Card */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
                        <div className="absolute top-4 right-4 z-10">
                            <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                                ⚡ Rápido
                            </span>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 group-hover:opacity-20 transition-opacity" />

                        <div className="relative p-8">
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">🤖</div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                    Plan Generado por IA
                                </h2>
                                <p className="text-gray-300">
                                    Genera instant

                                    áneamente un plan de entrenamiento con inteligencia artificial.
                                </p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>⚡ Generación instantánea</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>🎯 Adaptado a tus objetivos</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>🔄 Regenerable cuando quieras</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-200">
                                    <span>💪 Basado en ejercicios profesionales</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSelectAI}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                            >
                                Generar Plan con IA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <Card className="bg-white/5 border-white/10">
                        <div className="text-center p-4">
                            <div className="text-3xl mb-2">💡</div>
                            <h3 className="font-semibold text-white mb-2">¿No estás seguro?</h3>
                            <p className="text-sm text-gray-300">
                                Prueba el plan con IA primero. Siempre puedes cambiar a un entrenador más tarde.
                            </p>
                        </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <div className="text-center p-4">
                            <div className="text-3xl mb-2">🔄</div>
                            <h3 className="font-semibold text-white mb-2">Flexibilidad Total</h3>
                            <p className="text-sm text-gray-300">
                                Cambia entre tipos de plan cuando lo necesites desde tu dashboard.
                            </p>
                        </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <div className="text-center p-4">
                            <div className="text-3xl mb-2">📈</div>
                            <h3 className="font-semibold text-white mb-2">Progreso Garantizado</h3>
                            <p className="text-sm text-gray-300">
                                Ambos tipos de planes están diseñados para ayudarte a alcanzar tus metas.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Back Button */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate('/cliente/dashboard')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ← Volver al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanTypeSelector;
