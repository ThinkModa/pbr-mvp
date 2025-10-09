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
  forceInitials = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const getAvatarUrl = () => {
    if (!name || name.trim() === '') {
      return AvatarService.getFallbackAvatarUrl(size);
    }
    return AvatarService.getAppAvatarUrl(name, size);
  };

  const getInitials = () => {
    if (!name || name.trim() === '') {
      return fallbackText || '??';
    }
    return AvatarService.generateInitials(name);
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
  const hasUserPhoto = userPhotoUrl && !forceInitials;

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

  // Show user photo if available and not forced to show initials
  if (hasUserPhoto) {
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
