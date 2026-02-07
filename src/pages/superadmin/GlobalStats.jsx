import React, { useState, useEffect } from 'react';
import { gimnasioService } from '../../api/directus';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

export default function GlobalStats() {
    const [loading, setLoading] = useState(true);
    const [gimnasios, setGimnasios] = useState([]);
    const [globalStats, setGlobalStats] = useState({
        totalGimnasios: 0,
        totalEntrenadores: 0,
        totalClientes: 0,
        gimnasiosActivos: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await gimnasioService.getAll();
            setGimnasios(data);

            // Load stats for each gimnasio
            const statsPromises = data.map(g => gimnasioService.getStats(g.id));
            const allStats = await Promise.all(statsPromises);

            // Calculate global stats
            const stats = {
                totalGimnasios: data.length,
                gimnasiosActivos: data.filter(g => g.activo).length,
                totalEntrenadores: allStats.reduce((sum, s) => sum + s.totalEntrenadores, 0),
                totalClientes: allStats.reduce((sum, s) => sum + s.totalClientes, 0),
                entrenadoresActivos: allStats.reduce((sum, s) => sum + s.entrenadoresActivos, 0),
                clientesActivos: allStats.reduce((sum, s) => sum + s.clientesActivos, 0)
            };

            setGlobalStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando estadísticas..." />;
    }

    return (
        <div className="min-h-screen bg-dark-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Estadísticas Globales
                    </h1>
                    <p className="text-gray-400">
                        Vista general de toda la plataforma
                    </p>
                </div>

                {/* Global Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-primary-600 to-primary-700 border-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-primary-100 text-sm font-medium">
                                        Total Gimnasios
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {globalStats.totalGimnasios}
                                    </p>
                                    <p className="text-primary-200 text-xs mt-1">
                                        {globalStats.gimnasiosActivos} activos
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

                    <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">
                                        Total Entrenadores
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {globalStats.totalEntrenadores}
                                    </p>
                                    <p className="text-blue-200 text-xs mt-1">
                                        {globalStats.entrenadoresActivos} activos
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-full">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                                        Total Clientes
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {globalStats.totalClientes}
                                    </p>
                                    <p className="text-green-200 text-xs mt-1">
                                        {globalStats.clientesActivos} activos
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-full">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">
                                        Promedio Clientes/Gym
                                    </p>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {globalStats.totalGimnasios > 0
                                            ? Math.round(globalStats.totalClientes / globalStats.totalGimnasios)
                                            : 0}
                                    </p>
                                    <p className="text-purple-200 text-xs mt-1">
                                        {globalStats.totalGimnasios > 0
                                            ? Math.round(globalStats.totalEntrenadores / globalStats.totalGimnasios)
                                            : 0} entrenadores/gym
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-full">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Gimnasios Performance Table */}
                <Card className="bg-dark-800 border-dark-700">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Rendimiento por Gimnasio
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Gimnasio
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                                            Entrenadores
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                                            Clientes
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                                            Ratio C/E
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Registro
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {gimnasios.map((gimnasio) => {
                                        const ratio = gimnasio.totalEntrenadores > 0
                                            ? (gimnasio.totalClientes / gimnasio.totalEntrenadores).toFixed(1)
                                            : 0;

                                        return (
                                            <tr key={gimnasio.id} className="hover:bg-dark-700 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-primary-500/10 rounded-full flex items-center justify-center">
                                                            <span className="text-primary-500 font-semibold">
                                                                {gimnasio.nombre.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-white">
                                                                {gimnasio.nombre}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {gimnasio.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gimnasio.activo
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {gimnasio.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-sm text-white font-medium">
                                                        {gimnasio.totalEntrenadores || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-sm text-white font-medium">
                                                        {gimnasio.totalClientes || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`text-sm font-medium ${ratio > 10 ? 'text-red-500' :
                                                        ratio > 5 ? 'text-yellow-500' :
                                                            'text-green-500'
                                                        }`}>
                                                        {ratio}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-400">
                                                    {new Date(gimnasio.fecha_registro).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {gimnasios.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No hay gimnasios registrados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Additional Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <Card className="bg-dark-800 border-dark-700">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Tasa de Activación
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Gimnasios Activos</span>
                                        <span className="text-white font-medium">
                                            {globalStats.totalGimnasios > 0
                                                ? Math.round((globalStats.gimnasiosActivos / globalStats.totalGimnasios) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-dark-700 rounded-full h-2">
                                        <div
                                            className="bg-primary-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${globalStats.totalGimnasios > 0
                                                    ? (globalStats.gimnasiosActivos / globalStats.totalGimnasios) * 100
                                                    : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Entrenadores Activos</span>
                                        <span className="text-white font-medium">
                                            {globalStats.totalEntrenadores > 0
                                                ? Math.round((globalStats.entrenadoresActivos / globalStats.totalEntrenadores) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-dark-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${globalStats.totalEntrenadores > 0
                                                    ? (globalStats.entrenadoresActivos / globalStats.totalEntrenadores) * 100
                                                    : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Clientes Activos</span>
                                        <span className="text-white font-medium">
                                            {globalStats.totalClientes > 0
                                                ? Math.round((globalStats.clientesActivos / globalStats.totalClientes) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-dark-700 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${globalStats.totalClientes > 0
                                                    ? (globalStats.clientesActivos / globalStats.totalClientes) * 100
                                                    : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-dark-800 border-dark-700">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Información de la Plataforma
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Gimnasios con &gt; 10 clientes</span>
                                    <span className="text-white font-medium">
                                        {gimnasios.filter(g => (g.totalClientes || 0) > 10).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Gimnasios sin entrenadores</span>
                                    <span className="text-white font-medium">
                                        {gimnasios.filter(g => (g.totalEntrenadores || 0) === 0).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Gimnasios nuevos (30 días)</span>
                                    <span className="text-white font-medium">
                                        {gimnasios.filter(g => {
                                            const thirtyDaysAgo = new Date();
                                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                            return new Date(g.fecha_registro) >= thirtyDaysAgo;
                                        }).length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
