import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Overlay */}
                <div className="fixed inset-0 transition-opacity bg-dark-900 bg-opacity-75" onClick={onClose}></div>

                {/* Modal */}
                <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform glass rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold font-display text-gradient">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-4">{children}</div>

                    {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
                </div>
            </div>
        </div>
    );
};

export default Modal;
