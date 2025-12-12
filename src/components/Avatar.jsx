import React from 'react';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

/**
 * Avatar component that displays user profile image or initials fallback
 * 
 * @param {Object} props
 * @param {string} props.src - Avatar image ID from Directus or full URL
 * @param {string} props.firstName - User's first name (for initials)
 * @param {string} props.lastName - User's last name (for initials)
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional CSS classes
 */
const Avatar = ({
    src,
    firstName = '',
    lastName = '',
    size = 'md',
    className = ''
}) => {
    // Size mappings
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-20 h-20 text-2xl'
    };

    // Generate initials from name
    const getInitials = () => {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return first + last || '?';
    };

    // Generate consistent color based on name
    const getColor = () => {
        const colors = [
            'bg-primary-500',
            'bg-accent-500',
            'bg-green-500',
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500'
        ];
        const name = `${firstName}${lastName}`;
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Build image URL from Directus file ID
    const getImageUrl = () => {
        if (!src) return null;
        // If it's already a full URL, use it
        if (src.startsWith('http')) return src;
        // Otherwise, build Directus assets URL
        return `${directusUrl}/assets/${src}?fit=cover&width=200&height=200&quality=80`;
    };

    const imageUrl = getImageUrl();
    const sizeClass = sizes[size] || sizes.md;

    return (
        <div
            className={`
                ${sizeClass} 
                rounded-full 
                flex items-center justify-center 
                overflow-hidden 
                flex-shrink-0
                ${!imageUrl ? getColor() : 'bg-dark-600'}
                ${className}
            `}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={`${firstName} ${lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Hide image and show initials on error
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <span
                className={`font-semibold text-white ${imageUrl ? 'hidden' : 'flex'}`}
                style={{ display: imageUrl ? 'none' : 'flex' }}
            >
                {getInitials()}
            </span>
        </div>
    );
};

export default Avatar;
