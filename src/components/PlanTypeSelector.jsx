import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';

/**
 * PlanTypeSelector - Component for clients to choose between trainer or AI plan
 */
const PlanTypeSelector = ({ onSelect, clienteProfile }) => {
    const navigate = useNavigate();

    const planTypes = [
        {
            id: 'profesor',
            title: 'Plan con Profesor',
            icon: '👨‍🏫',
            color: 'from-blue-500 to-blue-600',
            description: 'Recibe un plan personalizado diseñado por tu entrenador profesional.',
            features: [
                '✅ Seguimiento personalizado',
                '✅ Ajustes basados en tu progreso',
                '✅ Comunicación directa con entrenador',
                '✅ Planes adaptados a tus objetivos específicos'
            ],
            buttonText: clienteProfile?.entrenador_asignado
                ? 'Esperar Plan del Entrenador'
                : 'Solicitar Asignación de Entrenador',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            available: true
        },
        {
            id: 'ia',
            title: 'Plan Generado por IA',
            icon: '🤖',
            color: 'from-purple-500 to-purple-600',
            description: 'Genera instantáneamente un plan de entrenamiento con inteligencia artificial.',
            features: [
                '⚡ Generación instantánea',
                '🎯 Adaptado a tus objetivos',
                '🔄 Regenerable cuando quieras',
                '💪 Basado en ejercicios profesionales'
            ],
            buttonText: 'Generar Plan con IA',
            buttonColor: 'bg-purple-600 hover:bg-purple-700',
            available: true
        }
    ];

    const handleSelect = (typeId) => {
        if (typeId === 'ia') {
            // Navigate to AI plan generator
            navigate('/cliente/generar-plan-ia');
        } else {
            // For trainer plan, just set the preference
            onSelect && onSelect(typeId);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Elige tu Tipo de Plan
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Selecciona cómo quieres gestionar tu entrenamiento. Puedes cambiar tu elección en cualquier momento.
                    </p>
                </div>

                {/* Plan Type Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {planTypes.map((type) => (
                        <div
                            key={type.id}
                            className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

                            {/* Content */}
                            <div className="relative p-8">
                                {/* Icon & Title */}
                                <div className="text-center mb-6">
                                    <div className="text-6xl mb-4">{type.icon}</div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        {type.title}
                                    </h2>
                                    <p className="text-gray-300">
                                        {type.description}
                                    </p>
                                </div>

                                {/* Features */}
                                <div className="space-y-3 mb-8">
                                    {type.features.map((feature, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-2 text-gray-200"
                                        >
                                            <span className="text-sm leading-relaxed">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleSelect(type.id)}
                                    disabled={!type.available}
                                    className={`w-full ${type.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg`}
                                >
                                    {type.buttonText}
                                </button>

                                {/* Recommended Badge (optional) */}
                                {type.id === 'ia' && (
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                                            ⚡ Rápido
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
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
