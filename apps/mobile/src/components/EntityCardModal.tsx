import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import AvatarComponent from './AvatarComponent';

interface EntityCardModalProps {
  visible: boolean;
  entity: {
    id: string;
    name: string;
    type: 'speaker' | 'vendor' | 'sponsor';
    // Speaker fields
    role?: string;
    company?: string;
    bio?: string;
    // Vendor fields
    businessName?: string;
    contactInfo?: string;
    description?: string;
    // Sponsor fields
    sponsorshipLevel?: string;
    website?: string;
  } | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EntityCardModal: React.FC<EntityCardModalProps> = ({ visible, entity, onClose }) => {
  console.log('🎯 EntityCardModal render:', { visible, entity, hasEntity: !!entity });
  if (!entity) {
    console.log('🎯 EntityCardModal: No entity, returning null');
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView style={styles.safeArea}>
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
                    size={100}
                    fallbackText="??"
                    forceInitials={true}
                  />
                </View>

                {/* Name */}
                <Text style={styles.entityName}>{entity.name}</Text>

                {/* Subtitle (role, business name, or sponsorship level) */}
                {getEntitySubtitle() && (
                  <Text style={styles.entitySubtitle}>{getEntitySubtitle()}</Text>
                )}

                {/* Company (if different from subtitle) */}
                {entity.company && entity.company !== getEntitySubtitle() && (
                  <Text style={styles.entityCompany}>{entity.company}</Text>
                )}

                {/* Description/Bio */}
                {getEntityDescription() && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>
                      {entity.type === 'speaker' ? 'Bio' : 'Description'}
                    </Text>
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
            </SafeAreaView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
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
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    marginBottom: 16,
  },
  entityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  entitySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  entityCompany: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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

export default EntityCardModal;
