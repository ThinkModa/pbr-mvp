import React, { useState } from 'react';

interface AvatarComponentProps {
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  size?: number;
  fallbackText?: string;
  className?: string;
}

const AvatarComponent: React.FC<AvatarComponentProps> = ({
  name,
  firstName,
  lastName,
  avatarUrl,
  size = 40,
  fallbackText = '??',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!avatarUrl);

  // Determine if we have a valid uploaded image
  const hasUploadedPhoto = avatarUrl && !imageError && avatarUrl.includes('avatars/');
  
  // Get initials from name or first/last name
  const getInitials = (): string => {
    if (firstName && lastName) {
      return `${firstName[0]?.toUpperCase() || ''}${lastName[0]?.toUpperCase() || ''}`;
    }
    
    if (name) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]?.toUpperCase() || ''}${nameParts[nameParts.length - 1][0]?.toUpperCase() || ''}`;
      }
      return name[0]?.toUpperCase() || '';
    }
    
    return fallbackText;
  };

  const handleImageError = () => {
    console.log('🎭 Profile image failed to load, falling back to initials:', avatarUrl);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('🎭 Profile image loaded successfully:', avatarUrl);
    setImageLoading(false);
  };

  const avatarStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${Math.max(12, size * 0.4)}px`,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative'
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%'
  };

  const loadingStyle: React.CSSProperties = {
    ...avatarStyle,
    fontSize: `${Math.max(10, size * 0.3)}px`,
    color: '#9CA3AF'
  };

  // Show loading state while image is loading
  if (hasUploadedPhoto && imageLoading) {
    return (
      <div style={loadingStyle} className={className}>
        ...
      </div>
    );
  }

  // Show uploaded image if available and not errored
  if (hasUploadedPhoto) {
    return (
      <div style={avatarStyle} className={className}>
        <img
          src={avatarUrl}
          alt={`${name || 'User'} avatar`}
          style={imageStyle}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div style={avatarStyle} className={className}>
      {getInitials()}
    </div>
  );
};

export default AvatarComponent;

