import React, { useState, useEffect } from 'react';

const InstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        console.log('[InstallButton] Component mounted');

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[InstallButton] App is already installed');
            setIsInstalled(true);
            return;
        }

        console.log('[InstallButton] Waiting for beforeinstallprompt event...');

        // Listen for the install prompt
        const handleBeforeInstallPrompt = (e) => {
            console.log('[InstallButton] beforeinstallprompt event fired!', e);
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            console.log('[InstallButton] App installed successfully!');
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    // Don't show if already installed or prompt not available
    if (isInstalled || !isVisible) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="fixed bottom-20 md:bottom-4 right-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-50 animate-pulse hover:animate-none"
        >
            <span className="text-xl">📲</span>
            <span className="font-semibold">Instalar App</span>
        </button>
    );
};

export default InstallButton;
