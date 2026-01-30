import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt, size = 'medium', className = '' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`avatar ${size} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <span className="avatar-initials">{getInitials(alt)}</span>
      )}
    </div>
  );
};

export default Avatar;
