import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { planesService, ejerciciosService, profileService } from '../../api/directus';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

const PlanForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [ejerciciosLibrary, setEjerciciosLibrary] = useState([]);
    const [loadingLibrary, setLoadingLibrary] = useState(true);

    const [plan, setPlan] = useState({
        nombre: '',
        descripcion: '',
        duracion_dias: 30,
        activo: true
    });
    const [ejercicios, setEjercicios] = useState([]);

    useEffect(() => {
        loadEjerciciosLibrary();
        if (isEditing) {
            loadPlan();
        }
    }, [id]);

    const loadEjerciciosLibrary = async () => {
        setLoadingLibrary(true);
        const data = await ejerciciosService.getAll();
        setEjerciciosLibrary(data);
        setLoadingLibrary(false);
    };

    const loadPlan = async () => {
        setLoading(true);
        const data = await planesService.getById(id);
        if (data) {
            setPlan({
                nombre: data.nombre || '',
                descripcion: data.descripcion || '',
                duracion_dias: data.duracion_dias || 30,
                activo: data.activo ?? true
            });
            // Map loaded exercises to include mode
            const mappedEjercicios = (data.ejercicios || []).map(ej => ({
                ...ej,
                mode: ej.ejercicio_id ? 'library' : 'adhoc',
                ejercicio_id: ej.ejercicio_id || null
            }));
            setEjercicios(mappedEjercicios);
        }
        setLoading(false);
    };

    const handleAddEjercicio = () => {
        setEjercicios([
            ...ejercicios,
            {
                mode: 'library', // Default to library mode
                ejercicio_id: null,
                nombre: '',
                descripcion: '',
                series: 3,
                repeticiones: 12,
                duracion_minutos: null,
                orden: ejercicios.length,
                imagen_file: null, // For uploaded image
                imagen_preview: null // For preview URL
            }
        ]);
    };

    const handleRemoveEjercicio = (index) => {
        setEjercicios(ejercicios.filter((_, i) => i !== index));
    };

    const handleEjercicioChange = (index, field, value) => {
        const updated = [...ejercicios];
        updated[index] = { ...updated[index], [field]: value };
        setEjercicios(updated);
    };

    const handleModeToggle = (index, mode) => {
        const updated = [...ejercicios];
        if (mode === 'library') {
            updated[index] = {
                ...updated[index],
                mode: 'library',
                ejercicio_id: null,
                nombre: '',
                descripcion: ''
            };
        } else {
            updated[index] = {
                ...updated[index],
                mode: 'adhoc',
                ejercicio_id: null
            };
        }
        setEjercicios(updated);
    };

    const handleLibrarySelection = (index, ejercicioId) => {
        const selectedEjercicio = ejerciciosLibrary.find(e => e.id === ejercicioId);
        if (selectedEjercicio) {
            const updated = [...ejercicios];
            updated[index] = {
                ...updated[index],
                ejercicio_id: ejercicioId,
                nombre: selectedEjercicio.nombre,
                descripcion: selectedEjercicio.descripcion || '',
                // Keep the series/reps/duration that user can modify
            };
            setEjercicios(updated);
        }
    };

    const handleImageChange = (index, file) => {
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen debe ser menor a 5MB');
            return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        const updated = [...ejercicios];
        updated[index] = {
            ...updated[index],
            imagen_file: file,
            imagen_preview: previewUrl
        };
        setEjercicios(updated);
    };

    const removeImage = (index) => {
        const updated = [...ejercicios];
        if (updated[index].imagen_preview) {
            URL.revokeObjectURL(updated[index].imagen_preview);
        }
        updated[index] = {
            ...updated[index],
            imagen_file: null,
            imagen_preview: null
        };
        setEjercicios(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Upload images for adhoc exercises that have files
            const processedEjercicios = await Promise.all(
                ejercicios.map(async (ej) => {
                    if (ej.mode === 'adhoc' && ej.imagen_file) {
                        try {
                            // Upload the image
                            const uploadedFile = await profileService.uploadAvatar(ej.imagen_file);
                            return {
                                ...ej,
                                imagen_referencia: uploadedFile.id,
                                imagen_file: null,
                                imagen_preview: null
                            };
                        } catch (uploadError) {
                            console.error('Error uploading exercise image:', uploadError);
                            // Continue without image if upload fails
                            return { ...ej, imagen_file: null, imagen_preview: null };
                        }
                    }
                    return ej;
                })
            );

            if (isEditing) {
                await planesService.updateWithExercises(id, plan, processedEjercicios);
            } else {
                await planesService.createWithExercises(plan, processedEjercicios);
            }
            navigate('/entrenador/planes');
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Error al guardar el plan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando plan..." />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                    {isEditing ? 'Editar Plan' : 'Crear Nuevo Plan'}
                </h1>
                <p className="text-gray-400">
                    {isEditing ? 'Modifica los detalles del plan' : 'Define un nuevo plan de entrenamiento'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Plan Details */}
                <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Detalles del Plan</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label">Nombre del Plan</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej: Plan Fuerza Basico"
                                value={plan.nombre}
                                onChange={(e) => setPlan({ ...plan, nombre: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">Descripcion</label>
                            <textarea
                                className="input"
                                rows="3"
                                placeholder="Describe el objetivo y contenido del plan..."
                                value={plan.descripcion}
                                onChange={(e) => setPlan({ ...plan, descripcion: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Duracion (dias)</label>
                            <input
                                type="number"
                                className="input"
                                min="1"
                                max="365"
                                value={plan.duracion_dias}
                                onChange={(e) => setPlan({ ...plan, duracion_dias: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="activo"
                                checked={plan.activo}
                                onChange={(e) => setPlan({ ...plan, activo: e.target.checked })}
                                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                            />
                            <label htmlFor="activo" className="text-gray-300">Plan activo</label>
                        </div>
                    </div>
                </Card>

                {/* Exercises */}
                <Card className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Ejercicios</h2>
                        <button
                            type="button"
                            onClick={handleAddEjercicio}
                            className="btn btn-secondary text-sm"
                        >
                            + Agregar Ejercicio
                        </button>
                    </div>

                    {ejercicios.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No hay ejercicios. Agrega el primer ejercicio.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ejercicios.map((ej, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-sm text-gray-500">
                                            Ejercicio #{index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEjercicio(index)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </div>

                                    {/* Mode Toggle */}
                                    <div className="mb-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleModeToggle(index, 'library')}
                                            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${ej.mode === 'library'
                                                ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                                                : 'bg-dark-600 border-dark-500 text-gray-400 hover:border-dark-400'
                                                }`}
                                        >
                                            📚 Desde Biblioteca
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleModeToggle(index, 'adhoc')}
                                            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${ej.mode === 'adhoc'
                                                ? 'bg-accent-500/20 border-accent-500 text-accent-300'
                                                : 'bg-dark-600 border-dark-500 text-gray-400 hover:border-dark-400'
                                                }`}
                                        >
                                            ✏️ Crear Nuevo
                                        </button>
                                    </div>

                                    {/* Library Mode - Exercise Selector */}
                                    {ej.mode === 'library' && (
                                        <div className="mb-4">
                                            <label className="label text-sm">Seleccionar Ejercicio</label>
                                            {loadingLibrary ? (
                                                <div className="text-sm text-gray-400">Cargando ejercicios...</div>
                                            ) : (
                                                <>
                                                    <select
                                                        className="input mb-2"
                                                        value={ej.ejercicio_id || ''}
                                                        onChange={(e) => handleLibrarySelection(index, e.target.value)}
                                                        required={ej.mode === 'library'}
                                                    >
                                                        <option value="">-- Seleccionar --</option>
                                                        {ejerciciosLibrary.map((libEj) => (
                                                            <option key={libEj.id} value={libEj.id}>
                                                                {libEj.nombre} {libEj.categoria ? `(${libEj.categoria})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Preview of selected exercise */}
                                                    {ej.ejercicio_id && (() => {
                                                        const selected = ejerciciosLibrary.find(e => e.id === ej.ejercicio_id);
                                                        return selected && (
                                                            <div className="p-3 bg-dark-600 rounded-lg border border-dark-500 flex items-center gap-3">
                                                                {selected.imagen_referencia && (
                                                                    <img
                                                                        src={`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/assets/${typeof selected.imagen_referencia === 'object' ? (selected.imagen_referencia.filename_disk || selected.imagen_referencia.id) : selected.imagen_referencia}?access_token=${JSON.parse(localStorage.getItem('directus_auth') || '{}').access_token || ''}`}
                                                                        alt={selected.nombre}
                                                                        className="w-16 h-16 object-cover rounded"
                                                                    />
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{selected.nombre}</div>
                                                                    {selected.descripcion && (
                                                                        <div className="text-xs text-gray-400 line-clamp-2">{selected.descripcion}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Ad-hoc Mode - Manual Input */}
                                    {ej.mode === 'adhoc' && (
                                        <>
                                            <div className="mb-3">
                                                <label className="label text-sm">Nombre</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Ej: Press de Banca"
                                                    value={ej.nombre}
                                                    onChange={(e) => handleEjercicioChange(index, 'nombre', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="label text-sm">Descripcion/Instrucciones</label>
                                                <textarea
                                                    className="input text-sm"
                                                    rows="2"
                                                    placeholder="Instrucciones para realizar el ejercicio..."
                                                    value={ej.descripcion || ''}
                                                    onChange={(e) => handleEjercicioChange(index, 'descripcion', e.target.value)}
                                                />
                                            </div>

                                            {/* Image Upload */}
                                            <div className="mb-3">
                                                <label className="label text-sm">Imagen de Referencia (opcional)</label>
                                                <div className="flex gap-3 items-start">
                                                    {ej.imagen_preview ? (
                                                        <div className="relative">
                                                            <img
                                                                src={ej.imagen_preview}
                                                                alt="Preview"
                                                                className="w-24 h-24 object-cover rounded-lg border border-dark-500"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-sm flex items-center justify-center hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="w-24 h-24 border-2 border-dashed border-dark-500 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-dark-700 transition-all">
                                                            <span className="text-2xl text-gray-500">📷</span>
                                                            <span className="text-xs text-gray-500 mt-1">Subir</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleImageChange(index, e.target.files[0])}
                                                            />
                                                        </label>
                                                    )}
                                                    <div className="text-xs text-gray-500 flex-1">
                                                        <p>Formatos: JPG, PNG, WEBP</p>
                                                        <p>Máximo 5MB</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Series, Reps, Duration - Always visible */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="label text-sm">Series</label>
                                            <input
                                                type="number"
                                                className="input"
                                                min="1"
                                                value={ej.series || ''}
                                                onChange={(e) => handleEjercicioChange(index, 'series', parseInt(e.target.value) || null)}
                                            />
                                        </div>

                                        <div>
                                            <label className="label text-sm">Repeticiones</label>
                                            <input
                                                type="number"
                                                className="input"
                                                min="1"
                                                value={ej.repeticiones || ''}
                                                onChange={(e) => handleEjercicioChange(index, 'repeticiones', parseInt(e.target.value) || null)}
                                            />
                                        </div>

                                        <div>
                                            <label className="label text-sm">Duracion (min)</label>
                                            <input
                                                type="number"
                                                className="input"
                                                min="1"
                                                placeholder="Para cardio"
                                                value={ej.duracion_minutos || ''}
                                                onChange={(e) => handleEjercicioChange(index, 'duracion_minutos', parseInt(e.target.value) || null)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Plan')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/entrenador/planes')}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div >
    );
};

export default PlanForm;
