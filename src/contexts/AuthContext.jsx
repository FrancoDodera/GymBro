import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/directus';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const authData = localStorage.getItem('directus_auth');
            if (!authData) {
                setLoading(false);
                return;
            }

            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);

                // Use detected role from getCurrentUser
                const roleName = currentUser.detectedRole || 'Administrator';
                setRole(roleName);

                console.log('[AuthContext.checkAuth] User:', currentUser.email);
                console.log('[AuthContext.checkAuth] Detected role:', roleName);

                // Try to load full profile if needed
                if (roleName === 'Cliente') {
                    try {
                        const { clienteService } = await import('../api/directus');
                        const prof = await clienteService.getMyProfile(currentUser.id);
                        setProfile(prof);
                    } catch (e) {
                        console.warn('[checkAuth] Could not load cliente profile');
                    }
                } else if (roleName === 'Entrenador') {
                    try {
                        const { entrenadorService } = await import('../api/directus');
                        const prof = await entrenadorService.getMyProfile(currentUser.id);
                        setProfile(prof);
                    } catch (e) {
                        console.warn('[checkAuth] Could not load entrenador profile');
                    }
                }
            }
        } catch (error) {
            console.error('[AuthContext.checkAuth] Error:', error);
            localStorage.removeItem('directus_auth');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { user, roleName, profile } = await authService.login(email, password);

            setUser(user);
            setRole(roleName);
            setProfile(profile);

            console.log('[AuthContext.login] Success - Role:', roleName);

            return true;
        } catch (error) {
            console.error('[AuthContext.login] Error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setProfile(null);
            setRole(null);
        } catch (error) {
            console.error('[AuthContext.logout] Error:', error);
        }
    };

    // Refresh user data (useful after profile updates)
    const refreshUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);

                // Refresh profile based on role
                if (role === 'Cliente') {
                    const { clienteService } = await import('../api/directus');
                    const prof = await clienteService.getMyProfile(currentUser.id);
                    setProfile(prof);
                } else if (role === 'Entrenador') {
                    const { entrenadorService } = await import('../api/directus');
                    const prof = await entrenadorService.getMyProfile(currentUser.id);
                    setProfile(prof);
                }
            }
        } catch (error) {
            console.error('[AuthContext.refreshUser] Error:', error);
        }
    };

    const value = {
        user,
        profile,
        role,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: role === 'Administrator',
        isEntrenador: role === 'Entrenador',
        isCliente: role === 'Cliente'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
