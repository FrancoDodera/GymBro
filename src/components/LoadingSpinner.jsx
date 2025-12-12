import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Cargando...' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={`${sizeClasses[size]} border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin`}></div>
            {message && <p className="mt-4 text-gray-400 text-sm">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
