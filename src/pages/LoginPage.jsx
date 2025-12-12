import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            }
        } catch (err) {
            setError('Credenciales incorrectas. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
            <div className="max-w-md w-full space-y-8">
                {/* Logo/Header */}
                <div className="text-center">
                    <h1 className="font-display text-5xl md:text-6xl font-bold text-gradient mb-2">
                        GYM BRO
                    </h1>
                    <p className="text-gray-400 text-lg">Sistema de Gestión de Gimnasio</p>
                </div>

                {/* Login Card */}
                <div className="card">
                    <div className="card-body">
                        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="label">Contraseña</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full py-3 text-lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Iniciando...
                                    </div>
                                ) : (
                                    'Ingresar'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-dark-700">
                            <div className="text-sm text-gray-400 space-y-2">
                                <p className="font-semibold text-gray-300">Credenciales de prueba:</p>
                                <div className="space-y-1">
                                    <p>Admin: <code className="text-primary-400">admin@gymbro.com</code></p>
                                    <p>Contraseña: <code className="text-primary-400">Admin123!</code></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500">
                    GYM BRO MVP © 2024 - Gestión de Gimnasios
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
