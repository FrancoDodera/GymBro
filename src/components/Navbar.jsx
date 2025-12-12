import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';

const Navbar = () => {
    const { user, role, logout, isAdmin, isEntrenador, isCliente } = useAuth();

    return (
        <nav className="navbar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="font-display text-2xl font-bold text-gradient">
                            GYM BRO
                        </Link>

                        <div className="hidden md:flex items-center gap-4">
                            {isAdmin && (
                                <>
                                    <Link to="/admin" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Dashboard
                                    </Link>
                                    <Link to="/admin/trainers" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Entrenadores
                                    </Link>
                                    <Link to="/admin/clients" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Clientes
                                    </Link>
                                    <Link to="/admin/plans" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Planes
                                    </Link>
                                </>
                            )}

                            {isEntrenador && (
                                <>
                                    <Link to="/entrenador" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Dashboard
                                    </Link>
                                    <Link to="/entrenador/clientes" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Clientes
                                    </Link>
                                    <Link to="/entrenador/planes" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Planes
                                    </Link>
                                    <Link to="/entrenador/ejercicios" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Ejercicios
                                    </Link>
                                </>
                            )}

                            {isCliente && (
                                <>
                                    <Link to="/cliente" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Dashboard
                                    </Link>
                                    <Link to="/cliente/plan" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Mi Plan
                                    </Link>
                                    <Link to="/cliente/sessions" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Sesiones
                                    </Link>
                                    <Link to="/cliente/progress" className="text-gray-300 hover:text-primary-500 transition-colors">
                                        Progreso
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <>
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                >
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-gray-200">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <p className="text-xs text-gray-400">{role}</p>
                                    </div>
                                    <Avatar
                                        src={user.avatar}
                                        firstName={user.first_name}
                                        lastName={user.last_name}
                                        size="sm"
                                    />
                                </Link>
                                <button onClick={logout} className="btn btn-secondary text-sm">
                                    Salir
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
