import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { generateTrainingPlan, getObjectiveOptions, getEquipmentOptions } from '../../services/AIService';
import { ejerciciosService, planesIAService } from '../../api/directus';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * AIPlanGenerator - Multi-step form to generate AI training plans
 */
const AIPlanGenerator = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        objetivo: '',
        nivelExperiencia: '',
        duracionTipo: '',
        diasSemana: 3,
        equipamiento: [],
        limitaciones: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);

    // Load available exercises
    useEffect(() => {
        loadEjercicios();
    }, []);

    const loadEjercicios = async () => {
        try {
            const ejercicios = await ejerciciosService.getAll();
            console.log('[AIPlanGenerator] Ejercicios cargados:', ejercicios.length);
            console.log('[AIPlanGenerator] Sample ejercicio:', ejercicios[0]);
            setEjerciciosDisponibles(ejercicios);
        } catch (error) {
            console.error('Error loading ejercicios:', error);
        }
    };

    const totalSteps = 6;
    const objectives = getObjectiveOptions();
    const equipment = getEquipmentOptions();

    // Step configuration
    const steps = [
        {
            title: 'Objetivo',
            description: '¿Qué quieres lograr?',
            icon: '🎯'
        },
        {
            title: 'Nivel',
            description: '¿Cuál es tu experiencia?',
            icon: '📊'
        },
        {
            title: 'Duración',
            description: '¿Tipo de plan?',
            icon: '📅'
        },
        {
            title: 'Frecuencia',
            description: '¿Cuántos días por semana?',
            icon: '🗓️'
        },
        {
            title: 'Equipamiento',
            description: '¿Qué tienes disponible?',
            icon: '🏋️'
        },
        {
            title: 'Limitaciones',
            description: 'Opcional: lesiones o restricciones',
            icon: '⚠️'
        }
    ];

    const handleNext = () => {
        // Validation
        if (currentStep === 1 && !formData.objetivo) {
            setError('Por favor selecciona un objetivo');
            return;
        }
        if (currentStep === 2 && !formData.nivelExperiencia) {
            setError('Por favor selecciona tu nivel de experiencia');
            return;
        }
        if (currentStep === 3 && !formData.duracionTipo) {
            setError('Por favor selecciona el tipo de duración');
            return;
        }
        if (currentStep === 5 && formData.equipamiento.length === 0) {
            setError('Por favor selecciona al menos un tipo de equipamiento');
            return;
        }

        setError(null);
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final step, generate plan
            handleGeneratePlan();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError(null);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const toggleEquipment = (value) => {
        setFormData(prev => {
            const newEquipment = prev.equipamiento.includes(value)
                ? prev.equipamiento.filter(e => e !== value)
                : [...prev.equipamiento, value];
            return { ...prev, equipamiento: newEquipment };
        });
    };

    const handleGeneratePlan = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[AIPlanGenerator] Generating plan with data:', formData);

            // Generate plan with AI
            const result = await generateTrainingPlan(formData, ejerciciosDisponibles);

            if (!result.success) {
                throw new Error('No se pudo generar el plan');
            }

            console.log('[AIPlanGenerator] Plan generated:', result.plan);

            // Save to database
            const planData = {
                cliente_id: user.profile.id,
                nombre: result.plan.nombre,
                descripcion: result.plan.descripcion,
                objetivo: formData.objetivo,
                nivel_experiencia: formData.nivelExperiencia,
                duracion_tipo: formData.duracionTipo,
                dias_semana: formData.diasSemana,
                equipamiento: formData.equipamiento,
                limitaciones: formData.limitaciones || null,
                prompt_usado: result.promptUsado
            };

            const savedPlan = await planesIAService.create(planData, result.plan.ejercicios);

            console.log('[AIPlanGenerator] Plan saved:', savedPlan);

            setGeneratedPlan(savedPlan);
            setCurrentStep(totalSteps + 1); // Move to success screen
        } catch (error) {
            console.error('Error generating plan:', error);
            setError(error.message || 'Hubo un error al generar tu plan. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Objetivo
                return (
                    <div className="grid md:grid-cols-2 gap-4">
                        {objectives.map((obj) => (
                            <button
                                key={obj.value}
                                onClick={() => handleChange('objetivo', obj.value)}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${formData.objetivo === obj.value
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="text-4xl mb-2">{obj.icon}</div>
                                <h3 className="text-lg font-semibold text-white mb-1">{obj.label}</h3>
                                <p className="text-sm text-gray-300">{obj.description}</p>
                            </button>
                        ))}
                    </div>
                );

            case 2: // Nivel
                return (
                    <div className="space-y-4">
                        {[
                            { value: 'principiante', label: 'Principiante', desc: 'Estoy empezando en el gimnasio', icon: '🌱' },
                            { value: 'intermedio', label: 'Intermedio', desc: 'Tengo experiencia de varios meses', icon: '💪' },
                            { value: 'avanzado', label: 'Avanzado', desc: 'Entreno regularmente hace más de un año', icon: '🏆' }
                        ].map((level) => (
                            <button
                                key={level.value}
                                onClick={() => handleChange('nivelExperiencia', level.value)}
                                className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${formData.nivelExperiencia === level.value
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="text-4xl">{level.icon}</div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">{level.label}</h3>
                                    <p className="text-sm text-gray-300">{level.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 3: // Duración
                return (
                    <div className="space-y-4">
                        {[
                            { value: 'diario', label: 'Plan Diario', desc: 'Un entrenamiento para hoy', icon: '📅' },
                            { value: 'semanal', label: 'Plan Semanal', desc: 'Rutina completa de 7 días', icon: '📆' },
                            { value: 'mensual', label: 'Plan Mensual', desc: 'Programa de 4 semanas con progresión', icon: '🗓️' }
                        ].map((dur) => (
                            <button
                                key={dur.value}
                                onClick={() => handleChange('duracionTipo', dur.value)}
                                className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${formData.duracionTipo === dur.value
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="text-4xl">{dur.icon}</div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">{dur.label}</h3>
                                    <p className="text-sm text-gray-300">{dur.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 4: // Frecuencia
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="text-6xl font-bold text-purple-500 mb-2">
                                {formData.diasSemana}
                            </div>
                            <p className="text-gray-300">
                                {formData.diasSemana === 1 ? 'día' : 'días'} por semana
                            </p>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="7"
                            value={formData.diasSemana}
                            onChange={(e) => handleChange('diasSemana', parseInt(e.target.value))}
                            className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>1 día</span>
                            <span>7 días</span>
                        </div>
                    </div>
                );

            case 5: // Equipamiento
                return (
                    <div className="grid md:grid-cols-2 gap-4">
                        {equipment.map((equip) => (
                            <button
                                key={equip.value}
                                onClick={() => toggleEquipment(equip.value)}
                                className={`p-5 rounded-xl border-2 transition-all text-left ${formData.equipamiento.includes(equip.value)
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{equip.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-white">{equip.label}</h3>
                                    </div>
                                    {formData.equipamiento.includes(equip.value) && (
                                        <div className="text-purple-500 text-xl">✓</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 6: // Limitaciones
                return (
                    <div className="space-y-4">
                        <p className="text-gray-300 text-center mb-4">
                            Si tienes alguna lesión o restricción física, descríbela aquí. Esto es opcional pero ayuda a generar un plan más seguro.
                        </p>
                        <textarea
                            value={formData.limitaciones}
                            onChange={(e) => handleChange('limitaciones', e.target.value)}
                            placeholder="Ejemplo: Dolor en la rodilla izquierda, evitar ejercicios de alto impacto..."
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[150px]"
                        />
                        <p className="text-sm text-gray-400 text-center">
                            Puedes dejarlo en blanco si no tienes limitaciones
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    // Success screen
    if (currentStep === totalSteps + 1 && generatedPlan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 flex items-center justify-center">
                <Card className="max-w-2xl w-full bg-white/5 border-white/10">
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            ¡Plan Generado Exitosamente!
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Tu plan personalizado ha sido creado y está listo para usar.
                        </p>
                        <div className="bg-white/5 rounded-xl p-6 mb-8">
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {generatedPlan.nombre}
                            </h3>
                            <p className="text-gray-300 text-sm">
                                {generatedPlan.descripcion}
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/cliente/mi-plan')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                Ver Mi Plan
                            </button>
                            <button
                                onClick={() => navigate('/cliente/dashboard')}
                                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                Ir al Dashboard
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="text-white text-xl font-semibold mt-6 mb-2">
                        Generando tu plan personalizado...
                    </p>
                    <p className="text-gray-400">
                        Esto puede tomar unos segundos
                    </p>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Generar Plan con IA
                    </h1>
                    <p className="text-gray-400">
                        Paso {currentStep} de {totalSteps}: {steps[currentStep - 1]?.title}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`flex-1 h-2 rounded-full mx-1 transition-colors ${index < currentStep
                                    ? 'bg-purple-500'
                                    : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Step Card */}
                <Card className="bg-white/5 border-white/10 mb-6">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-3">{steps[currentStep - 1]?.icon}</div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {steps[currentStep - 1]?.title}
                            </h2>
                            <p className="text-gray-400">
                                {steps[currentStep - 1]?.description}
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
                                {error}
                            </div>
                        )}

                        {/* Step content */}
                        {renderStepContent()}
                    </div>
                </Card>

                {/* Navigation buttons */}
                <div className="flex gap-4 justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Atrás
                    </button>
                    <button
                        onClick={() => navigate('/cliente/dashboard')}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-semibold rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        {currentStep === totalSteps ? '✨ Generar Plan' : 'Siguiente →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIPlanGenerator;
