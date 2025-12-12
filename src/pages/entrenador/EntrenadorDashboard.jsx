import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { entrenadorService } from '../../api/directus';

const EntrenadorDashboard = () => {
    const { profile } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            loadClients();
        }
    }, [profile]);

    const loadClients = async () => {
        setLoading(true);
        const clientsData = await entrenadorService.getMyClients(profile.id);
        setClients(clientsData);
        setLoading(false);
    };

    if (loading) {
        return <LoadingSpinner message="Cargando dashboard..." />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">Panel de Entrenador</h1>
                <p className="text-gray-400">Gestiona y supervisa a tus clientes</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="stat-card bg-gradient-to-br from-primary-500/20 to-primary-700/10 border-primary-500/30">
                    <div className="text-center">
                        <p className="stat-label mb-2">Clientes Totales</p>
                        <p className="stat-value text-primary-400">{clients.length}</p>
                    </div>
                </Card>

                <Card className="stat-card bg-gradient-to-br from-accent-500/20 to-accent-700/10 border-accent-500/30">
                    <div className="text-center">
                        <p className="stat-label mb-2">Clientes Activos</p>
                        <p className="stat-value text-accent-400">{clients.length}</p>
                    </div>
                </Card>

                <Card className="stat-card bg-gradient-to-br from-green-500/20 to-green-700/10 border-green-500/30">
                    <div className="text-center">
                        <p className="stat-label mb-2">Planes Asignados</p>
                        <p className="stat-value text-green-400">-</p>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card header={<h2 className="text-xl font-bold">Acciones Rapidas</h2>}>
                    <div className="space-y-3">
                        <a href="/entrenador/planes" className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Gestionar Planes</h3>
                                    <p className="text-sm text-gray-400">Crear y editar planes de entrenamiento</p>
                                </div>
                            </div>
                        </a>
                        <a href="/entrenador/clientes" className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Gestionar Clientes</h3>
                                    <p className="text-sm text-gray-400">Ver y asignar planes a clientes</p>
                                </div>
                            </div>
                        </a>
                        <a href="/entrenador/ejercicios" className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Gestionar Ejercicios</h3>
                                    <p className="text-sm text-gray-400">Crear y editar biblioteca de ejercicios</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </Card>

                <Card header={<h2 className="text-xl font-bold">Mis Clientes</h2>}>
                    {clients.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {clients.map((client) => (
                                <div key={client.id} className="p-3 bg-dark-700 rounded-lg">
                                    <p className="font-medium">
                                        {client.user_id?.first_name} {client.user_id?.last_name}
                                    </p>
                                    <p className="text-sm text-gray-400">{client.user_id?.email}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>No tienes clientes asignados aún</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default EntrenadorDashboard;
