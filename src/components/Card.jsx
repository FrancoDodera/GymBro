import React from 'react';

const Card = ({ children, className = '', header, footer }) => {
    return (
        <div className={`card ${className}`}>
            {header && <div className="card-header">{header}</div>}
            <div className="card-body">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-dark-700">{footer}</div>}
        </div>
    );
};

export default Card;
