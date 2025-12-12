import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ejerciciosService } from '../../api/directus';

const EjercicioForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [ejercicio, setEjercicio] = useState({
        nombre: '',
        descripcion: '',
        categoria: '',
        nivel_dificultad: '',
        activo: true
    });

    const [imagenFile, setImagenFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

    useEffect(() => {
        if (isEditing) {
            loadEjercicio();
        }
    }, [id]);

    const loadEjercicio = async () => {
        setLoading(true);
        const data = await ejerciciosService.getById(id);
        if (data) {
            setEjercicio({
                nombre: data.nombre || '',
                descripcion: data.descripcion || '',
                categoria: data.categoria || '',
                nivel_dificultad: data.nivel_dificultad || '',
                activo: data.activo ?? true
            });

            // Load existing image/video previews
            if (data.imagen_referencia) {
                setImagenPreview(import.meta.env.VITE_DIRECTUS_URL + '/assets/' + data.imagen_referencia.id);
            }
            if (data.video_referencia) {
                setVideoPreview(import.meta.env.VITE_DIRECTUS_URL + '/assets/' + data.video_referencia.id);
            }
        }
        setLoading(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona un archivo de imagen válido');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('La imagen no debe superar 10MB');
                return;
            }

            setImagenFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagenPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                alert('Por favor selecciona un archivo de video válido');
                return;
            }

            if (file.size > 50 * 1024 * 1024) {
                alert('El video no debe superar 50MB');
                return;
            }

            setVideoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setVideoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const ejercicioData = {
                id: isEditing ? id : crypto.randomUUID(),
                nombre: ejercicio.nombre,
                activo: ejercicio.activo
            };

            if (ejercicio.descripcion) ejercicioData.descripcion = ejercicio.descripcion;
            if (ejercicio.categoria) ejercicioData.categoria = ejercicio.categoria;
            if (ejercicio.nivel_dificultad) ejercicioData.nivel_dificultad = ejercicio.nivel_dificultad;

            // Upload files
            if (imagenFile) {
                setUploadingFile(true);
                try {
                    const uploadedImage = await ejerciciosService.uploadFile(imagenFile);
                    ejercicioData.imagen_referencia = uploadedImage.id;
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert('Error al subir la imagen. El ejercicio se guardará sin imagen.');
                }
                setUploadingFile(false);
            }

            if (videoFile) {
                setUploadingFile(true);
                try {
                    const uploadedVideo = await ejerciciosService.uploadFile(videoFile);
                    ejercicioData.video_referencia = uploadedVideo.id;
                } catch (uploadError) {
                    console.error('Error uploading video:', uploadError);
                    alert('Error al subir el video. El ejercicio se guardará sin video.');
                }
                setUploadingFile(false);
            }

            if (isEditing) {
                await ejerciciosService.update(id, ejercicioData);
            } else {
                await ejerciciosService.create(ejercicioData);
            }

            navigate('/entrenador/ejercicios');
        } catch (error) {
            console.error('Error details:', error);
            alert('Error al guardar el ejercicio: ' + (error.errors?.[0]?.message || error.message || 'Error desconocido'));
        } finally {
            setSaving(false);
            setUploadingFile(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando ejercicio..." />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">
                    {isEditing ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}
                </h1>
                <p className="text-gray-400">
                    {isEditing ? 'Modifica los detalles del ejercicio' : 'Agrega un nuevo ejercicio a tu biblioteca'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Información Básica</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label">Nombre del Ejercicio</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej: Press de Banca"
                                value={ejercicio.nombre}
                                onChange={(e) => setEjercicio({ ...ejercicio, nombre: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Categoría</label>
                            <select
                                className="input"
                                value={ejercicio.categoria}
                                onChange={(e) => setEjercicio({ ...ejercicio, categoria: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="pecho">Pecho</option>
                                <option value="espalda">Espalda</option>
                                <option value="piernas">Piernas</option>
                                <option value="hombros">Hombros</option>
                                <option value="brazos">Brazos</option>
                                <option value="core">Core</option>
                                <option value="cardio">Cardio</option>
                                <option value="funcional">Funcional</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Nivel de Dificultad</label>
                            <select
                                className="input"
                                value={ejercicio.nivel_dificultad}
                                onChange={(e) => setEjercicio({ ...ejercicio, nivel_dificultad: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="principiante">Principiante</option>
                                <option value="intermedio">Intermedio</option>
                                <option value="avanzado">Avanzado</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">Descripción/Instrucciones</label>
                            <textarea
                                className="input"
                                rows="5"
                                placeholder="Describe cómo realizar el ejercicio, técnica, consejos, etc..."
                                value={ejercicio.descripcion}
                                onChange={(e) => setEjercicio({ ...ejercicio, descripcion: e.target.value })}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Material de Referencia</h2>
                    <p className="text-sm text-yellow-500 mb-4">
                        Nota: Si tienes problemas subiendo archivos, verifica los permisos en Directus Admin
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Imagen de Referencia</label>
                            <p className="text-sm text-gray-400 mb-2">Máximo 10MB - JPG, PNG, WebP</p>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="imagen-upload"
                            />

                            <label
                                htmlFor="imagen-upload"
                                className="btn btn-secondary cursor-pointer inline-block mb-3"
                            >
                                {imagenPreview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                            </label>

                            {imagenPreview && (
                                <div className="relative">
                                    <img
                                        src={imagenPreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg border border-dark-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagenPreview(null);
                                            setImagenFile(null);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label">Video Demostrativo</label>
                            <p className="text-sm text-gray-400 mb-2">Máximo 50MB - MP4, WebM, MOV</p>

                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="hidden"
                                id="video-upload"
                            />

                            <label
                                htmlFor="video-upload"
                                className="btn btn-secondary cursor-pointer inline-block mb-3"
                            >
                                {videoPreview ? 'Cambiar Video' : 'Seleccionar Video'}
                            </label>

                            {videoPreview && (
                                <div className="relative">
                                    <video
                                        src={videoPreview}
                                        controls
                                        className="w-full h-48 object-cover rounded-lg border border-dark-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVideoPreview(null);
                                            setVideoFile(null);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {uploadingFile && (
                        <div className="mt-4 text-center text-primary-400">
                            <LoadingSpinner message="Subiendo archivo..." />
                        </div>
                    )}
                </Card>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={saving || uploadingFile}
                    >
                        {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Ejercicio')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/entrenador/ejercicios')}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EjercicioForm;
