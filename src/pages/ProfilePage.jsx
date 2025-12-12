import React, { useState, useRef } from 'react';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { profileService, authService } from '../api/directus';

const ProfilePage = () => {
    const { user, profile, role, refreshUser } = useAuth();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // User info form
    const [userForm, setUserForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || ''
    });

    // Role-specific profile form
    const [profileForm, setProfileForm] = useState({
        // Cliente fields
        objetivo: profile?.objetivo || '',
        fecha_nacimiento: profile?.fecha_nacimiento || '',
        altura_cm: profile?.altura_cm || '',
        peso_kg: profile?.peso_kg || '',
        // Entrenador fields
        especialidad: profile?.especialidad || '',
        descripcion: profile?.descripcion || '',
        certificaciones: profile?.certificaciones || '',
        anos_experiencia: profile?.anos_experiencia || ''
    });

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const isCliente = role === 'Cliente';
    const isEntrenador = role === 'Entrenador';

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage({ type: 'error', text: 'La imagen debe ser menor a 5MB' });
            return;
        }

        setLoading(true);
        try {
            // Upload file
            const uploadedFile = await profileService.uploadAvatar(file);

            // Update user with new avatar
            await profileService.updateUserInfo(user.id, {
                first_name: userForm.first_name,
                last_name: userForm.last_name,
                avatar: uploadedFile.id
            });

            // Refresh user data
            if (refreshUser) await refreshUser();

            setMessage({ type: 'success', text: 'Avatar actualizado correctamente' });
        } catch (error) {
            console.error('Error updating avatar:', error);
            setMessage({ type: 'error', text: 'Error al actualizar el avatar' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUserInfo = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await profileService.updateUserInfo(user.id, userForm);
            if (refreshUser) await refreshUser();
            setMessage({ type: 'success', text: 'Información actualizada correctamente' });
        } catch (error) {
            console.error('Error saving user info:', error);
            setMessage({ type: 'error', text: 'Error al guardar los cambios' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isCliente && profile?.id) {
                await profileService.updateClienteProfile(profile.id, profileForm);
            } else if (isEntrenador && profile?.id) {
                await profileService.updateEntrenadorProfile(profile.id, profileForm);
            }

            if (refreshUser) await refreshUser();
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Error al guardar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }

        setLoading(true);
        try {
            await profileService.changePassword(null, passwordForm.newPassword);
            setShowPasswordModal(false);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <LoadingSpinner message="Cargando perfil..." />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display text-gradient mb-2">Mi Perfil</h1>
                <p className="text-gray-400">Gestiona tu información personal y preferencias</p>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                    {message.text}
                    <button
                        onClick={() => setMessage({ type: '', text: '' })}
                        className="float-right text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Avatar Section */}
                <Card className="md:col-span-1">
                    <div className="text-center py-4">
                        <div className="relative inline-block mb-4">
                            <Avatar
                                src={user.avatar}
                                firstName={user.first_name}
                                lastName={user.last_name}
                                size="xl"
                                className="mx-auto"
                            />
                            <button
                                onClick={handleAvatarClick}
                                disabled={loading}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <h2 className="text-xl font-bold">{user.first_name} {user.last_name}</h2>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${role === 'Administrator' ? 'bg-purple-500/20 text-purple-400' :
                            role === 'Entrenador' ? 'bg-primary-500/20 text-primary-400' :
                                'bg-accent-500/20 text-accent-400'
                            }`}>
                            {role}
                        </span>
                    </div>
                </Card>

                {/* User Info Form */}
                <Card className="md:col-span-2" header={<h3 className="text-lg font-semibold">Información Personal</h3>}>
                    <form onSubmit={handleSaveUserInfo} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nombre</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={userForm.first_name}
                                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Apellido</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={userForm.last_name}
                                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input bg-dark-600"
                                value={user.email}
                                disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">El email no puede ser modificado</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(true)}
                                className="btn btn-secondary"
                            >
                                Cambiar Contraseña
                            </button>
                        </div>
                    </form>
                </Card>
            </div>

            {/* Role-specific profile section */}
            {(isCliente || isEntrenador) && profile && (
                <Card className="mt-6" header={
                    <h3 className="text-lg font-semibold">
                        {isCliente ? 'Información de Cliente' : 'Información de Entrenador'}
                    </h3>
                }>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        {isCliente && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Objetivo</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={profileForm.objetivo}
                                            onChange={(e) => setProfileForm({ ...profileForm, objetivo: e.target.value })}
                                            placeholder="Ej: Pérdida de peso, Ganancia muscular..."
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={profileForm.fecha_nacimiento || ''}
                                            onChange={(e) => setProfileForm({ ...profileForm, fecha_nacimiento: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Altura (cm)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={profileForm.altura_cm || ''}
                                            onChange={(e) => setProfileForm({ ...profileForm, altura_cm: e.target.value })}
                                            placeholder="Ej: 175"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Peso (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="input"
                                            value={profileForm.peso_kg || ''}
                                            onChange={(e) => setProfileForm({ ...profileForm, peso_kg: e.target.value })}
                                            placeholder="Ej: 70.5"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {isEntrenador && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Especialidad</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={profileForm.especialidad}
                                            onChange={(e) => setProfileForm({ ...profileForm, especialidad: e.target.value })}
                                            placeholder="Ej: Crossfit, Musculación, Funcional..."
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Años de Experiencia</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={profileForm.anos_experiencia || ''}
                                            onChange={(e) => setProfileForm({ ...profileForm, anos_experiencia: e.target.value })}
                                            placeholder="Ej: 5"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Descripción</label>
                                    <textarea
                                        className="input min-h-[100px] resize-none"
                                        value={profileForm.descripcion}
                                        onChange={(e) => setProfileForm({ ...profileForm, descripcion: e.target.value })}
                                        placeholder="Breve descripción de tu experiencia y enfoque..."
                                    />
                                </div>
                                <div>
                                    <label className="label">Certificaciones</label>
                                    <textarea
                                        className="input min-h-[80px] resize-none"
                                        value={profileForm.certificaciones}
                                        onChange={(e) => setProfileForm({ ...profileForm, certificaciones: e.target.value })}
                                        placeholder="Lista tus certificaciones y cursos..."
                                    />
                                </div>
                            </>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : 'Guardar Perfil'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Cambiar Contraseña"
            >
                <form onSubmit={handleChangePassword}>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="label">Nueva Contraseña</label>
                            <input
                                type="password"
                                className="input"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                required
                                minLength="6"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div>
                            <label className="label">Confirmar Contraseña</label>
                            <input
                                type="password"
                                className="input"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                required
                                minLength="6"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-dark-700">
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(false)}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
