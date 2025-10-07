import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Business, BusinessContact } from '../services/businessesService';

interface BusinessModalProps {
  visible: boolean;
  business: Business | null;
  contacts: BusinessContact[];
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BusinessModal: React.FC<BusinessModalProps> = ({ visible, business, contacts, onClose }) => {
  if (!business) return null;

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return '💼';
      case 'twitter': return '🐦';
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'youtube': return '📺';
      default: return '🔗';
    }
  };

  const getSocialLabel = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'twitter': return 'Twitter';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'youtube': return 'YouTube';
      default: return platform;
    }
  };

  const primaryContact = contacts.find(contact => contact.isPrimary) || contacts[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Business Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.logoContainer}>
              {business.logoUrl ? (
                <Image source={{ uri: business.logoUrl }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>
                    {business.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.name}>{business.name}</Text>
            
            {business.industry && (
              <Text style={styles.industry}>{business.industry}</Text>
            )}
            
            {business.size && (
              <Text style={styles.size}>{business.size} • {business.employeeCount} employees</Text>
            )}
          </View>

          {/* About Section */}
          {business.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{business.description}</Text>
            </View>
          )}

          {/* Services Section */}
          {business.services && business.services.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              <View style={styles.tagsContainer}>
                {business.services.map((service, index) => (
                  <View key={index} style={styles.serviceTag}>
                    <Text style={styles.serviceText}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Products Section */}
          {business.products && business.products.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Products</Text>
              <View style={styles.tagsContainer}>
                {business.products.map((product, index) => (
                  <View key={index} style={styles.productTag}>
                    <Text style={styles.productText}>{product}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Representative Section */}
          {primaryContact && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Representative</Text>
              <View style={styles.contactCard}>
                <Text style={styles.contactName}>
                  {primaryContact.firstName} {primaryContact.lastName}
                </Text>
                {primaryContact.title && (
                  <Text style={styles.contactTitle}>{primaryContact.title}</Text>
                )}
                <Text style={styles.contactRole}>{primaryContact.role}</Text>
              </View>
            </View>
          )}

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            
            {business.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>📧</Text>
                <Text style={styles.contactText}>{business.email}</Text>
              </View>
            )}

            {business.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{business.phone}</Text>
              </View>
            )}

            {business.website && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>🌐</Text>
                <Text style={styles.contactText}>{business.website}</Text>
              </View>
            )}

            {/* Social Links */}
            {Object.entries(business.socialLinks).map(([platform, url]) => {
              if (!url) return null;
              return (
                <View key={platform} style={styles.contactItem}>
                  <Text style={styles.contactIcon}>{getSocialIcon(platform)}</Text>
                  <Text style={styles.contactText}>{getSocialLabel(platform)}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  industry: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  size: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  productTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  productText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  contactCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contactTitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
});

export default BusinessModal;
