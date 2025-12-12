import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminService } from '../../api/directus';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalTrainers: 0, totalClients: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const data = await adminService.getStats();
        setStats(data);
        setLoading(false);
    };

    if (loading) {
        return <LoadingSpinner message="Cargando estadísticas..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">Panel de Administración</h1>
                <p className="text-gray-400">Estadísticas y gestión del sistema</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="stat-card bg-gradient-to-br from-primary-500/20 to-primary-700/10 border-primary-500/30">
                    <div className="text-center">
                        <p className="stat-label mb-2">Usuarios Totales</p>
                        <p className="stat-value text-primary-400">{stats.totalUsers}</p>
                    </div>
                </Card>

                <Card className="stat-card bg-gradient-to-br from-accent-500/20 to-accent-700/10 border-accent-500/30">
                    <div className="text-center">
                        <p className="stat-label mb-2">Entrenadores Activos</p>
                        <p className="stat-value text-accent-400">{stats.totalTrainers}</p>
                    </div>
                </Card>

                <Card className="stat-card bg-gradient-to-br from-green-500/20 to-green-700/10 border-green-500/30">
                    <div className="text-center">
                        <p className="stat-label mb-2">Clientes Registrados</p>
                        <p className="stat-value text-green-400">{stats.totalClients}</p>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card header={<h2 className="text-xl font-bold">Acciones Rápidas</h2>}>
                    <div className="space-y-3">
                        <a href="/admin/trainers" className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Gestionar Entrenadores</h3>
                                    <p className="text-sm text-gray-400">Habilitar/Deshabilitar cuentas</p>
                                </div>
                            </div>
                        </a>

                        <a href="/admin/plans" className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Gestionar Planes</h3>
                                    <p className="text-sm text-gray-400">Crear y editar planes</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </Card>

                <Card header={<h2 className="text-xl font-bold">Información del Sistema</h2>}>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Versión:</span>
                            <span className="font-medium">1.0.0 MVP</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Backend:</span>
                            <span className="font-medium">Directus + PostgreSQL</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Frontend:</span>
                            <span className="font-medium">React + Vite</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Estado:</span>
                            <span className="badge badge-success">Operativo</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
