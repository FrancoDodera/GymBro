import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gimnasioService } from '../../api/directus';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

export default function GimnasiosManager() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [gimnasios, setGimnasios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadGimnasios();
    }, []);

    const loadGimnasios = async () => {
        try {
            setLoading(true);
            const data = await gimnasioService.getAll();
            console.log('Gimnasios loaded:', data);
            setGimnasios(data);
        } catch (error) {
            console.error('Error loading gimnasios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (gimnasioId, currentStatus) => {
        try {
            await gimnasioService.toggleStatus(gimnasioId, !currentStatus);
            loadGimnasios(); // Reload data
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar el estado del gimnasio');
        }
    };

    const filteredGimnasios = gimnasios.filter(gimnasio => {
        const matchesSearch = gimnasio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            gimnasio.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && gimnasio.activo) ||
            (filterStatus === 'inactive' && !gimnasio.activo);
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <LoadingSpinner message="Cargando gimnasios..." />;
    }

    return (
        <div className="min-h-screen bg-dark-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Gestión de Gimnasios
                        </h1>
                        <p className="text-gray-400">
                            Administra todos los gimnasios de la plataforma
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Gimnasio
                    </button>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <CreateGimnasioModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            loadGimnasios();
                        }}
                    />
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-dark-800 border-dark-700">
                        <div className="p-4">
                            <p className="text-gray-400 text-sm">Total</p>
                            <p className="text-2xl font-bold text-white">{gimnasios.length}</p>
                        </div>
                    </Card>
                    <Card className="bg-dark-800 border-dark-700">
                        <div className="p-4">
                            <p className="text-gray-400 text-sm">Activos</p>
                            <p className="text-2xl font-bold text-green-500">
                                {gimnasios.filter(g => g.activo).length}
                            </p>
                        </div>
                    </Card>
                    <Card className="bg-dark-800 border-dark-700">
                        <div className="p-4">
                            <p className="text-gray-400 text-sm">Inactivos</p>
                            <p className="text-2xl font-bold text-red-500">
                                {gimnasios.filter(g => !g.activo).length}
                            </p>
                        </div>
                    </Card>
                    <Card className="bg-dark-800 border-dark-700">
                        <div className="p-4">
                            <p className="text-gray-400 text-sm">Nuevos (este mes)</p>
                            <p className="text-2xl font-bold text-primary-500">
                                {gimnasios.filter(g => {
                                    const registroDate = new Date(g.fecha_registro);
                                    const now = new Date();
                                    return registroDate.getMonth() === now.getMonth() &&
                                        registroDate.getFullYear() === now.getFullYear();
                                }).length}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === 'all'
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === 'active'
                                ? 'bg-green-500 text-white'
                                : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700'
                                }`}
                        >
                            Activos
                        </button>
                        <button
                            onClick={() => setFilterStatus('inactive')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === 'inactive'
                                ? 'bg-red-500 text-white'
                                : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700'
                                }`}
                        >
                            Inactivos
                        </button>
                    </div>
                </div>

                {/* Table */}
                <Card className="bg-dark-800 border-dark-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Gimnasio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Ubicación
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Registro
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {filteredGimnasios.map((gimnasio) => (
                                    <tr
                                        key={gimnasio.id}
                                        className="hover:bg-dark-700 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                                                    <span className="text-primary-500 font-semibold text-lg">
                                                        {gimnasio.nombre?.charAt(0)?.toUpperCase() || 'G'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">
                                                        {gimnasio.nombre || 'Sin nombre'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {gimnasio.id}
                                                    </div>
                                                    {gimnasio.user_id && (
                                                        <div className="text-xs text-gray-600">
                                                            Usuario: {gimnasio.user_id.first_name} {gimnasio.user_id.last_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-300">{gimnasio.email || 'No especificado'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-300">
                                                {gimnasio.direccion || 'No especificado'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(gimnasio.id, gimnasio.activo)}
                                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${gimnasio.activo
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                    }`}
                                            >
                                                {gimnasio.activo ? '✓ Activo' : '✗ Inactivo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(gimnasio.fecha_registro).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/superadmin/gimnasios/${gimnasio.id}`)}
                                                    className="text-primary-500 hover:text-primary-400 transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => alert('Próximamente: Editar gimnasio')}
                                                    className="text-blue-500 hover:text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredGimnasios.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-300">
                                    No se encontraron gimnasios
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all'
                                        ? 'Intenta ajustar los filtros de búsqueda'
                                        : 'Comienza creando tu primer gimnasio'}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Create Gimnasio Modal Component
function CreateGimnasioModal({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        descripcion: '',
        direccion: '',
        telefono: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.nombre || !formData.email || !formData.password) {
            setError('Por favor complete todos los campos obligatorios');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        try {
            setLoading(true);
            await gimnasioService.create(formData);
            onSuccess();
        } catch (error) {
            console.error('Error creating gimnasio:', error);
            setError(error.message || 'Error al crear el gimnasio. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Crear Nuevo Gimnasio</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-500 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Nombre del Gimnasio <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Ej: Gimnasio Fitness Pro"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="contacto@gimnasio.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Contraseña <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Confirmar Contraseña <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Repetir contraseña"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                placeholder="Descripción del gimnasio..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Dirección completa"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Gimnasio'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
