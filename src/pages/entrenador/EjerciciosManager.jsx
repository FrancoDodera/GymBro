import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageCarousel from '../../components/ImageCarousel';
import { ejerciciosService } from '../../api/directus';

const EjerciciosManager = () => {
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ categoria: '', nivel: '', search: '' });

    useEffect(() => {
        loadEjercicios();
    }, []);

    const loadEjercicios = async () => {
        setLoading(true);
        const data = await ejerciciosService.getAll();
        setEjercicios(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
            try {
                await ejerciciosService.delete(id);
                loadEjercicios(); // Reload list
            } catch (error) {
                alert('Error al eliminar el ejercicio');
            }
        }
    };

    // Apply filters
    const filteredEjercicios = ejercicios.filter(ej => {
        if (filter.categoria && ej.categoria !== filter.categoria) return false;
        if (filter.nivel && ej.nivel_dificultad !== filter.nivel) return false;
        if (filter.search && !ej.nombre.toLowerCase().includes(filter.search.toLowerCase())) return false;
        return true;
    });

    const getCategoriaLabel = (cat) => {
        const labels = {
            pecho: 'Pecho',
            espalda: 'Espalda',
            piernas: 'Piernas',
            hombros: 'Hombros',
            brazos: 'Brazos',
            core: 'Core',
            cardio: 'Cardio',
            funcional: 'Funcional'
        };
        return labels[cat] || cat;
    };

    const getNivelLabel = (nivel) => {
        const labels = {
            principiante: 'Principiante',
            intermedio: 'Intermedio',
            avanzado: 'Avanzado'
        };
        return labels[nivel] || nivel;
    };

    if (loading) {
        return <LoadingSpinner message="Cargando ejercicios..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold font-display text-gradient mb-2">Biblioteca de Ejercicios</h1>
                    <p className="text-gray-400">Gestiona tus ejercicios reutilizables</p>
                </div>
                <Link to="/entrenador/ejercicios/nuevo" className="btn btn-primary">
                    + Crear Ejercicio
                </Link>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label text-sm">Buscar</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Nombre del ejercicio..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label text-sm">Categoría</label>
                        <select
                            className="input"
                            value={filter.categoria}
                            onChange={(e) => setFilter({ ...filter, categoria: e.target.value })}
                        >
                            <option value="">Todas</option>
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
                        <label className="label text-sm">Nivel</label>
                        <select
                            className="input"
                            value={filter.nivel}
                            onChange={(e) => setFilter({ ...filter, nivel: e.target.value })}
                        >
                            <option value="">Todos</option>
                            <option value="principiante">Principiante</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="avanzado">Avanzado</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Exercise Grid */}
            {filteredEjercicios.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4">
                            {filter.search || filter.categoria || filter.nivel
                                ? 'No se encontraron ejercicios con los filtros aplicados'
                                : 'No tienes ejercicios aún'}
                        </p>
                        <Link to="/entrenador/ejercicios/nuevo" className="btn btn-primary">
                            Crear Primer Ejercicio
                        </Link>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEjercicios.map((ejercicio) => (
                        <Card key={ejercicio.id} className="flex flex-col">
                            {/* Image Carousel */}
                            <div className="h-48 bg-dark-700 rounded-lg overflow-hidden mb-4">
                                <ImageCarousel
                                    images={[
                                        ejercicio.imagen_url_1,
                                        ejercicio.imagen_url_2
                                    ]}
                                    alt={ejercicio.nombre}
                                    className="h-full w-full"
                                />
                            </div>

                            {/* Exercise Info */}
                            <h3 className="text-lg font-bold mb-2">{ejercicio.nombre}</h3>

                            <div className="flex gap-2 mb-3">
                                {ejercicio.categoria && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                                        {getCategoriaLabel(ejercicio.categoria)}
                                    </span>
                                )}
                                {ejercicio.nivel_dificultad && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-accent-500/20 text-accent-300 border border-accent-500/30">
                                        {getNivelLabel(ejercicio.nivel_dificultad)}
                                    </span>
                                )}
                            </div>

                            {ejercicio.descripcion && (
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                    {ejercicio.descripcion}
                                </p>
                            )}

                            {/* Media Indicators */}
                            <div className="flex gap-2 mb-4 text-sm text-gray-500">
                                {ejercicio.imagen_referencia && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Imagen
                                    </span>
                                )}
                                {ejercicio.video_referencia && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Video
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex gap-2">
                                <Link
                                    to={`/entrenador/ejercicios/editar/${ejercicio.id}`}
                                    className="flex-1 btn btn-secondary text-sm"
                                >
                                    Editar
                                </Link>
                                <button
                                    onClick={() => handleDelete(ejercicio.id)}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EjerciciosManager;
