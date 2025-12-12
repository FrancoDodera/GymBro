import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BottomNav = () => {
    const { isAdmin, isEntrenador, isCliente, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) return null;

    // Define navigation items based on role
    const getNavItems = () => {
        if (isAdmin) {
            return [
                { path: '/admin', icon: '🏠', label: 'Inicio' },
                { path: '/admin/trainers', icon: '🏋️', label: 'Trainers' },
                { path: '/admin/clients', icon: '👥', label: 'Clientes' },
                { path: '/admin/plans', icon: '📋', label: 'Planes' },
                { path: '/profile', icon: '👤', label: 'Perfil' },
            ];
        }
        if (isEntrenador) {
            return [
                { path: '/entrenador', icon: '🏠', label: 'Inicio' },
                { path: '/entrenador/clientes', icon: '👥', label: 'Clientes' },
                { path: '/entrenador/planes', icon: '📋', label: 'Planes' },
                { path: '/entrenador/ejercicios', icon: '💪', label: 'Ejercicios' },
                { path: '/profile', icon: '👤', label: 'Perfil' },
            ];
        }
        if (isCliente) {
            return [
                { path: '/cliente', icon: '🏠', label: 'Inicio' },
                { path: '/cliente/plan', icon: '📋', label: 'Mi Plan' },
                { path: '/cliente/sessions', icon: '📝', label: 'Sesiones' },
                { path: '/cliente/progress', icon: '📊', label: 'Progreso' },
                { path: '/profile', icon: '👤', label: 'Perfil' },
            ];
        }
        return [];
    };

    const navItems = getNavItems();

    const isActive = (path) => {
        // Exact match for home paths, startsWith for others
        if (path === '/admin' || path === '/entrenador' || path === '/cliente') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-lg border-t border-dark-700 md:hidden z-50 safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${active
                                    ? 'text-primary-400'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <span className={`text-xl mb-0.5 ${active ? 'scale-110' : ''} transition-transform`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-medium ${active ? 'text-primary-400' : ''}`}>
                                {item.label}
                            </span>
                            {active && (
                                <div className="absolute bottom-0 w-12 h-0.5 bg-primary-500 rounded-t-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
