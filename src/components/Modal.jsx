import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, mobileFullscreen = true }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-dark-900 bg-opacity-90 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container - Fullscreen on mobile, centered on desktop */}
            <div className={`
                fixed inset-0 flex items-end sm:items-center justify-center
                ${mobileFullscreen ? 'sm:p-4' : 'p-4'}
            `}>
                <div
                    className={`
                        relative w-full bg-dark-800 
                        ${mobileFullscreen
                            ? 'h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl'
                            : 'max-w-2xl max-h-[90vh] rounded-2xl'
                        }
                        overflow-hidden shadow-2xl
                        transform transition-all
                        flex flex-col
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Sticky */}
                    <div className="sticky top-0 z-10 bg-dark-800 border-b border-dark-700 px-4 sm:px-6 py-4 flex items-center justify-between">
                        <h3 className="text-xl sm:text-2xl font-bold font-display text-gradient pr-4 flex-1 line-clamp-1">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-all active:scale-95"
                            aria-label="Cerrar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                        {children}
                    </div>

                    {/* Footer - Sticky (if provided) */}
                    {footer && (
                        <div className="sticky bottom-0 bg-dark-800 border-t border-dark-700 px-4 sm:px-6 py-4">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
