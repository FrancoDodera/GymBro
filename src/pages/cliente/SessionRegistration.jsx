import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { clienteService } from '../../api/directus';

const SessionRegistration = () => {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        horas_entrenadas: '',
        tipo_entrenamiento: 'pesas',
        notas: ''
    });
    const [saving, setSaving] = useState(false);

    const tiposEntrenamiento = [
        { value: 'pesas', label: 'Pesas', icon: '🏋️' },
        { value: 'cardio', label: 'Cardio', icon: '🏃' },
        { value: 'yoga', label: 'Yoga', icon: '🧘' },
        { value: 'funcional', label: 'Funcional', icon: '💪' },
        { value: 'crossfit', label: 'Crossfit', icon: '🔥' },
        { value: 'natacion', label: 'Natación', icon: '🏊' },
        { value: 'mixto', label: 'Mixto', icon: '🎯' }
    ];

    useEffect(() => {
        if (profile?.id) {
            loadSessions();
        }
    }, [profile]);

    const loadSessions = async () => {
        setLoading(true);
        const data = await clienteService.getMySessions(profile.id);
        setSessions(data);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await clienteService.createSession({
                cliente_id: profile.id,
                ...formData,
                horas_entrenadas: parseFloat(formData.horas_entrenadas)
            });

            setShowCreateModal(false);
            setShowSuccessModal(true);
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                horas_entrenadas: '',
                tipo_entrenamiento: 'pesas',
                notas: ''
            });
            loadSessions();
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Error al registrar la sesión');
        } finally {
            setSaving(false);
        }
    };

    const getTipoInfo = (tipo) => {
        return tiposEntrenamiento.find(t => t.value === tipo) || { label: tipo, icon: '💪' };
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Stats
    const totalSessions = sessions.length;
    const totalHours = sessions.reduce((sum, s) => sum + (parseFloat(s.horas_entrenadas) || 0), 0);
    const thisWeekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.fecha);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
    }).length;

    if (loading) {
        return <LoadingSpinner message="Cargando sesiones..." />;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mis Sesiones</h1>
                    <p className="text-gray-400">Registro de tus entrenamientos</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                >
                    + Registrar Sesión
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-primary-400">{totalSessions}</p>
                        <p className="text-xs text-gray-400">Sesiones Totales</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-400">{totalHours.toFixed(1)}</p>
                        <p className="text-xs text-gray-400">Horas Totales</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-accent-400">{thisWeekSessions}</p>
                        <p className="text-xs text-gray-400">Esta Semana</p>
                    </div>
                </Card>
                <Card className="!p-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-orange-400">
                            {totalSessions > 0 ? (totalHours / totalSessions).toFixed(1) : '0'}
                        </p>
                        <p className="text-xs text-gray-400">Hrs Promedio</p>
                    </div>
                </Card>
            </div>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏋️</div>
                        <h3 className="text-xl font-semibold mb-2">No hay sesiones registradas</h3>
                        <p className="text-gray-400 mb-6">¡Comienza registrando tu primer entrenamiento!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Registrar Primera Sesión
                        </button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => {
                        const tipoInfo = getTipoInfo(session.tipo_entrenamiento);

                        return (
                            <Card key={session.id} className="hover:border-primary-500/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                                        {tipoInfo.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold">{tipoInfo.label}</span>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-sm text-gray-400">
                                                {formatDate(session.fecha)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <span>⏱️</span>
                                                {session.horas_entrenadas} {session.horas_entrenadas === 1 ? 'hora' : 'horas'}
                                            </span>
                                            {session.notas && (
                                                <span className="truncate max-w-xs">
                                                    📝 {session.notas}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <span className="text-2xl font-bold text-primary-400">
                                            {session.horas_entrenadas}h
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Session Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Registrar Sesión"
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Fecha</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Horas Entrenadas</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="12"
                                    className="input"
                                    placeholder="1.5"
                                    value={formData.horas_entrenadas}
                                    onChange={(e) => setFormData({ ...formData, horas_entrenadas: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Tipo de Entrenamiento</label>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {tiposEntrenamiento.map((tipo) => (
                                    <button
                                        key={tipo.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo_entrenamiento: tipo.value })}
                                        className={`p-3 rounded-lg border-2 transition-all text-center ${formData.tipo_entrenamiento === tipo.value
                                            ? 'border-primary-500 bg-primary-500/20'
                                            : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{tipo.icon}</div>
                                        <div className="text-xs">{tipo.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label">Notas (Opcional)</label>
                            <textarea
                                className="input min-h-[80px] resize-none"
                                placeholder="¿Cómo te sentiste? ¿Qué ejercicios hiciste?"
                                value={formData.notas}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-dark-700">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="btn btn-secondary"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Registrar Sesión'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="¡Sesión Registrada!"
            >
                <div className="text-center py-6">
                    <div className="text-6xl mb-4">🎉</div>
                    <p className="text-xl font-semibold mb-2">¡Excelente trabajo!</p>
                    <p className="text-gray-400">Tu sesión de entrenamiento ha sido registrada exitosamente.</p>
                </div>
                <div className="flex justify-center mt-4">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowSuccessModal(false)}
                    >
                        ¡Genial!
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default SessionRegistration;
