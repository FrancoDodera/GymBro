import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LoadingSpinner from './components/LoadingSpinner';
import InstallButton from './components/InstallButton';

// Pages
import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import GimnasiosManager from './pages/superadmin/GimnasiosManager';
import GlobalStats from './pages/superadmin/GlobalStats';
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainersManager from './pages/admin/TrainersManager';
import AdminClientesManager from './pages/admin/AdminClientesManager';
import AdminPlanesManager from './pages/admin/AdminPlanesManager';
import ClienteDashboard from './pages/cliente/ClienteDashboard';
import SessionRegistration from './pages/cliente/SessionRegistration';
import ProgressPage from './pages/cliente/ProgressPage';
import MyPlanPage from './pages/cliente/MyPlanPage';
import AIPlanGenerator from './pages/cliente/AIPlanGenerator';
import PlanTypeSelector from './components/PlanTypeSelector';
import EntrenadorDashboard from './pages/entrenador/EntrenadorDashboard';
import PlanesManager from './pages/entrenador/PlanesManager';
import PlanForm from './pages/entrenador/PlanForm';
import EjerciciosManager from './pages/entrenador/EjerciciosManager';
import EjercicioForm from './pages/entrenador/EjercicioForm';
import ClientesManager from './pages/entrenador/ClientesManager';
import ProfilePage from './pages/ProfilePage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Case-insensitive role check
    if (allowedRoles) {
        const normalizedRole = role?.toLowerCase() || '';
        const hasAccess = allowedRoles.some(r =>
            normalizedRole.includes(r.toLowerCase()) ||
            r.toLowerCase().includes(normalizedRole)
        );

        console.log('ProtectedRoute check:', { role, allowedRoles, hasAccess });

        if (!hasAccess) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

// Main Router Component
const Router = () => {
    const { isAuthenticated, isSuperAdmin, isGimnasio, isEntrenador, isCliente, loading, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Handle root redirect based on role
    useEffect(() => {
        if (!loading && isAuthenticated && location.pathname === '/') {
            console.log('[App] Redirecting user with role:', role);

            if (role === 'SuperAdmin') {
                navigate('/superadmin', { replace: true });
            } else if (role === 'Gimnasio') {
                navigate('/gimnasio', { replace: true });
            } else if (role === 'Entrenador') {
                navigate('/entrenador', { replace: true });
            } else if (role === 'Cliente') {
                navigate('/cliente', { replace: true });
            } else {
                console.warn('[App] Unknown role:', role);
            }
        }
    }, [isAuthenticated, role, loading, location.pathname, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-900">
                <LoadingSpinner message="Cargando aplicación..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 pb-20 md:pb-0">
            {isAuthenticated && <Navbar />}
            {isAuthenticated && <BottomNav />}
            <InstallButton />

            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
                />

                {/* Root - Show loading or login */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <div className="min-h-screen flex items-center justify-center bg-dark-900">
                                <LoadingSpinner message="Redirigiendo..." />
                            </div>
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Profile Route - All authenticated users */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* SuperAdmin Routes */}
                <Route
                    path="/superadmin"
                    element={
                        <ProtectedRoute allowedRoles={['superadmin']}>
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/gimnasios"
                    element={
                        <ProtectedRoute allowedRoles={['superadmin']}>
                            <GimnasiosManager />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/stats"
                    element={
                        <ProtectedRoute allowedRoles={['superadmin']}>
                            <GlobalStats />
                        </ProtectedRoute>
                    }
                />

                {/* Gimnasio Routes (previously Admin) */}
                <Route
                    path="/gimnasio"
                    element={
                        <ProtectedRoute allowedRoles={['gimnasio']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/gimnasio/trainers"
                    element={
                        <ProtectedRoute allowedRoles={['gimnasio']}>
                            <TrainersManager />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/gimnasio/clients"
                    element={
                        <ProtectedRoute allowedRoles={['gimnasio']}>
                            <AdminClientesManager />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/gimnasio/plans"
                    element={
                        <ProtectedRoute allowedRoles={['gimnasio']}>
                            <AdminPlanesManager />
                        </ProtectedRoute>
                    }
                />

                {/* Legacy Admin Routes - redirect to Gimnasio */}
                <Route path="/admin" element={<Navigate to="/gimnasio" replace />} />
                <Route path="/admin/trainers" element={<Navigate to="/gimnasio/trainers" replace />} />
                <Route path="/admin/clients" element={<Navigate to="/gimnasio/clients" replace />} />
                <Route path="/admin/plans" element={<Navigate to="/gimnasio/plans" replace />} />

                {/* Entrenador Routes */}
                <Route
                    path="/entrenador"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <EntrenadorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/planes"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <PlanesManager />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/planes/nuevo"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <PlanForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/planes/editar/:id"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <PlanForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/clientes"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <ClientesManager />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/ejercicios"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <EjerciciosManager />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/ejercicios/nuevo"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <EjercicioForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/entrenador/ejercicios/editar/:id"
                    element={
                        <ProtectedRoute allowedRoles={['entrenador', 'entren']}>
                            <EjercicioForm />
                        </ProtectedRoute>
                    }
                />

                {/* Cliente Routes */}
                <Route
                    path="/cliente"
                    element={
                        <ProtectedRoute allowedRoles={['cliente', 'client']}>
                            <ClienteDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/sessions"
                    element={
                        <ProtectedRoute allowedRoles={['cliente', 'client']}>
                            <SessionRegistration />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/progress"
                    element={
                        <ProtectedRoute allowedRoles={['cliente', 'client']}>
                            <ProgressPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/plan"
                    element={
                        <ProtectedRoute allowedRoles={['cliente', 'client']}>
                            <MyPlanPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/elegir-plan"
                    element={
                        <ProtectedRoute allowedRoles={['cliente', 'client']}>
                            <PlanTypeSelector />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/generar-plan-ia"
                    element={
                        <ProtectedRoute allowedRoles={['cliente', 'client']}>
                            <AIPlanGenerator />
                        </ProtectedRoute>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Router />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
