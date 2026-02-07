import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gimnasioService } from '../../api/directus';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [gimnasios, setGimnasios] = useState([]);
    const [stats, setStats] = useState({
        totalGimnasios: 0,
        activos: 0,
        inactivos: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await gimnasioService.getAll();
            setGimnasios(data);

            // Calculate stats
            setStats({
                totalGimnasios: data.length,
                activos: data.filter(g => g.activo).length,
                inactivos: data.filter(g => !g.activo).length
            });
        } catch (error) {
            console.error('Error loading gimnasios:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-dark-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Panel de Super Admin
                    </h1>
                    <p className="text-gray-400">
                        Gestión de la plataforma multi-tenant
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-primary-600 to-primary-700 border-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-primary-100 text-sm font-medium">
                                        Total Gimnasios
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {stats.totalGimnasios}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-full">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">
                                        Gimnasios Activos
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {stats.activos}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-full">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-600 to-red-700 border-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-sm font-medium">
                                        Gimnasios Inactivos
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {stats.inactivos}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-full">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/superadmin/gimnasios')}
                            className="p-6 bg-dark-800 border border-dark-700 rounded-lg hover:border-primary-500 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-semibold">Gestionar Gimnasios</h3>
                                    <p className="text-gray-400 text-sm">Ver, crear y administrar gimnasios</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/superadmin/stats')}
                            className="p-6 bg-dark-800 border border-dark-700 rounded-lg hover:border-primary-500 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-semibold">Estadísticas Globales</h3>
                                    <p className="text-gray-400 text-sm">Reportes y métricas de la plataforma</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Recent Gimnasios */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Gimnasios Recientes
                    </h2>
                    <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-dark-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Registro
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700">
                                {gimnasios.slice(0, 5).map((gimnasio) => (
                                    <tr
                                        key={gimnasio.id}
                                        className="hover:bg-dark-700 cursor-pointer transition-colors"
                                        onClick={() => navigate(`/superadmin/gimnasios/${gimnasio.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                                                    <span className="text-primary-500 font-semibold">
                                                        {gimnasio.nombre.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">
                                                        {gimnasio.nombre}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-300">{gimnasio.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gimnasio.activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {gimnasio.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(gimnasio.fecha_registro).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {gimnasios.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-300">No hay gimnasios</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Comienza creando tu primer gimnasio.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => navigate('/superadmin/gimnasios/nuevo')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        Crear Gimnasio
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
