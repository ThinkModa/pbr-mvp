import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  StyleSheet,
} from 'react-native';
import { Organization } from '../services/organizationsService';

interface OrganizationModalProps {
  visible: boolean;
  organization: Organization | null;
  onClose: () => void;
}

const OrganizationModal: React.FC<OrganizationModalProps> = ({
  visible,
  organization,
  onClose,
}) => {
  if (!organization) return null;

  const handleWebsitePress = () => {
    if (organization.website) {
      Linking.openURL(organization.website);
    }
  };

  const handleEmailPress = () => {
    if (organization.email) {
      Linking.openURL(`mailto:${organization.email}`);
    }
  };

  const handlePhonePress = () => {
    if (organization.phone) {
      Linking.openURL(`tel:${organization.phone}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organization Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Organization Logo and Basic Info */}
          <View style={styles.profileSection}>
            <View style={styles.logoContainer}>
              {organization.logoUrl ? (
                <Image source={{ uri: organization.logoUrl }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>
                    {organization.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.organizationName}>{organization.name}</Text>
            
            {organization.industry && (
              <Text style={styles.industry}>{organization.industry}</Text>
            )}
            
            {organization.size && (
              <Text style={styles.size}>Size: {organization.size}</Text>
            )}
            
            {organization.foundedYear && (
              <Text style={styles.foundedYear}>Founded: {organization.foundedYear}</Text>
            )}
          </View>

          {/* Description */}
          {organization.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{organization.description}</Text>
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            {organization.email && (
              <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>{organization.email}</Text>
              </TouchableOpacity>
            )}
            
            {organization.phone && (
              <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>{organization.phone}</Text>
              </TouchableOpacity>
            )}
            
            {organization.website && (
              <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
                <Text style={styles.contactLabel}>Website:</Text>
                <Text style={styles.contactValue}>{organization.website}</Text>
              </TouchableOpacity>
            )}
            
            {organization.address && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Address:</Text>
                <Text style={styles.contactValue}>{organization.address}</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {organization.tags && organization.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {organization.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  organizationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  industry: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  size: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  foundedYear: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  contactItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
    marginRight: 12,
  },
  contactValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
});

export default OrganizationModal;
