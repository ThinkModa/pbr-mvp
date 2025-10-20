/**
 * AvatarComponent
 * 
 * Displays user avatars with the following behavior:
 * 
 * 1. PROFILE PAGES: Shows user-uploaded photo if available, otherwise generated initials avatar
 * 2. MESSAGING: Always shows initials only (forceInitials=true) for privacy and consistency
 * 3. FALLBACK: Shows initials if image fails to load
 * 
 * Usage:
 * - Profile: <AvatarComponent name="John Doe" userPhotoUrl={user.avatarUrl} />
 * - Messaging: <AvatarComponent name="John Doe" forceInitials={true} />
 */

import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AvatarService } from '../services/avatarService';

export interface AvatarComponentProps {
  name: string;
  size?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showInitials?: boolean;
  fallbackText?: string;
  onError?: () => void;
  userPhotoUrl?: string; // Optional user-uploaded photo
  forceInitials?: boolean; // Force initials even if photo is available
  allowExternalImages?: boolean; // Allow external image URLs (for speakers/vendors/sponsors)
}

const AvatarComponent: React.FC<AvatarComponentProps> = ({
  name,
  size = 48,
  style,
  textStyle,
  showInitials = false,
  fallbackText,
  onError,
  userPhotoUrl,
  forceInitials = false,
  allowExternalImages = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // console.log('🎭 AvatarComponent rendered with props:', { name, size, userPhotoUrl, forceInitials });

  const handleImageError = () => {
    // console.log('🎭 Google profile image failed to load, falling back to initials');
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  const handleImageLoad = () => {
    // console.log('🎭 Google profile image loaded successfully');
    setImageLoading(false);
  };

  const getAvatarUrl = () => {
    if (!name || name.trim() === '') {
      return AvatarService.getFallbackAvatarUrl(size);
    }
    return AvatarService.getAppAvatarUrl(name, size);
  };

  const getInitials = () => {
    console.log('🎭 AvatarComponent getInitials called with name:', name);
    if (!name || name.trim() === '') {
      console.log('🎭 No name provided, using fallback:', fallbackText || '??');
      return fallbackText || '??';
    }
    // Handle cases where name might be an email
    if (name.includes('@')) {
      const emailPrefix = name.split('@')[0];
      console.log('🎭 Name contains @, using email prefix:', emailPrefix);
      return AvatarService.generateInitials(emailPrefix);
    }
    console.log('🎭 Using full name for initials:', name);
    const initials = AvatarService.generateInitials(name);
    console.log('🎭 AvatarService.generateInitials returned:', initials);
    return initials;
  };

  const getBackgroundColor = () => {
    if (!name || name.trim() === '') {
      return '#6B7280';
    }
    return AvatarService.generateBackgroundColor(name);
  };

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: getBackgroundColor(),
    },
    style,
  ];

  const textStyleCombined = [
    styles.text,
    {
      fontSize: size * 0.4,
      color: '#ffffff',
    },
    textStyle,
  ];

  // Determine what to show
  const shouldShowInitials = imageError || showInitials || forceInitials;
  // For regular users: only uploaded photos (avatars/), for speakers/vendors/sponsors: any valid image URL
  const hasValidImage = userPhotoUrl && !forceInitials && (allowExternalImages || userPhotoUrl.includes('avatars/'));
  
  console.log('🎭 AvatarComponent rendering decision:', {
    name,
    userPhotoUrl,
    allowExternalImages,
    forceInitials,
    shouldShowInitials,
    hasValidImage,
    imageError
  });
  
  // console.log('🎭 AvatarComponent rendering decision:', {
  //   shouldShowInitials,
  //   hasUserPhoto,
  //   imageError,
  //   showInitials,
  //   forceInitials,
  //   userPhotoUrl: !!userPhotoUrl
  // });

  // Show initials if image failed to load, explicitly requested, or forced
  if (shouldShowInitials) {
    return (
      <View style={containerStyle}>
        <Text style={textStyleCombined}>
          {getInitials()}
        </Text>
      </View>
    );
  }

  // Show image if available and not forced to show initials
  if (hasValidImage) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: userPhotoUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onError={handleImageError}
          onLoad={handleImageLoad}
          resizeMode="cover"
        />
        {imageLoading && (
          <View style={[styles.loadingOverlay, { borderRadius: size / 2 }]}>
            <Text style={textStyleCombined}>
              {getInitials()}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Fallback to generated avatar
  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: getAvatarUrl() }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        onError={handleImageError}
        onLoad={handleImageLoad}
        resizeMode="cover"
      />
      {imageLoading && (
        <View style={[styles.loadingOverlay, { borderRadius: size / 2 }]}>
          <Text style={textStyleCombined}>
            {getInitials()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default AvatarComponent;
