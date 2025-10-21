import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import AvatarComponent from './AvatarComponent';

interface EntityCardOverlayProps {
  visible: boolean;
  entity: {
    id: string;
    name: string;
    type: 'speaker' | 'vendor' | 'sponsor';
    // Speaker fields
    role?: string;
    company?: string;
    bio?: string;
    profileImageUrl?: string;
    // Vendor fields
    businessName?: string;
    contactInfo?: string;
    description?: string;
    logoUrl?: string;
    // Sponsor fields
    sponsorshipLevel?: string;
    website?: string;
  } | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EntityCardOverlay: React.FC<EntityCardOverlayProps> = ({ visible, entity, onClose }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  console.log('🎯 EntityCardOverlay render:', { visible, entity, hasEntity: !!entity });

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible || !entity) {
    console.log('🎯 EntityCardOverlay: Not visible or no entity, returning null');
    return null;
  }

  const getEntityTitle = () => {
    switch (entity.type) {
      case 'speaker':
        return 'Speaker';
      case 'vendor':
        return 'Vendor';
      case 'sponsor':
        return 'Sponsor';
      default:
        return 'Entity';
    }
  };

  const getEntitySubtitle = () => {
    switch (entity.type) {
      case 'speaker':
        return entity.role || entity.company || '';
      case 'vendor':
        return entity.businessName || entity.company || '';
      case 'sponsor':
        return entity.sponsorshipLevel || entity.company || '';
      default:
        return '';
    }
  };

  const getEntityDescription = () => {
    switch (entity.type) {
      case 'speaker':
        return entity.bio;
      case 'vendor':
        return entity.description;
      case 'sponsor':
        return entity.description;
      default:
        return '';
    }
  };

  console.log('🎯 EntityCardOverlay: About to render content for entity:', entity.name);
  console.log('🎯 EntityCardOverlay: Profile image URL:', entity.profileImageUrl);
  console.log('🎯 EntityCardOverlay: Logo URL:', entity.logoUrl);
  console.log('🎯 EntityCardOverlay: Final image URL being passed to AvatarComponent:', entity.profileImageUrl || entity.logoUrl);

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        }
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.entityType}>{getEntityTitle()}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <AvatarComponent
                  name={entity.name}
                  size={120}
                  fallbackText="??"
                  userPhotoUrl={entity.profileImageUrl || entity.logoUrl}
                  forceInitials={false}
                  allowExternalImages={true}
                />
              </View>

              {/* Name */}
              <Text style={styles.entityName}>{entity.name}</Text>

              {/* Role/Title */}
              {entity.role && (
                <Text style={styles.entityRole}>{entity.role}</Text>
              )}

              {/* Company */}
              {entity.company && (
                <Text style={styles.entityCompany}>@{entity.company}</Text>
              )}

              {/* Description/Bio */}
              {getEntityDescription() && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{getEntityDescription()}</Text>
                </View>
              )}

              {/* Additional info based on type */}
              {entity.type === 'vendor' && entity.contactInfo && (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Contact</Text>
                  <Text style={styles.infoText}>{entity.contactInfo}</Text>
                </View>
              )}

              {entity.type === 'sponsor' && entity.website && (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={styles.infoText}>{entity.website}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.95,
    maxWidth: 500,
    maxHeight: screenHeight * 0.8,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 400, // Make it taller to show all content
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  entityType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  entityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  entityRole: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  entityCompany: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  descriptionContainer: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default EntityCardOverlay;
