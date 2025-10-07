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
import { Speaker } from '../services/speakersService';

interface SpeakerModalProps {
  visible: boolean;
  speaker: Speaker | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SpeakerModal: React.FC<SpeakerModalProps> = ({ visible, speaker, onClose }) => {
  if (!speaker) return null;

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return '💼';
      case 'twitter': return '🐦';
      case 'github': return '🐙';
      case 'website': return '🌐';
      default: return '🔗';
    }
  };

  const getSocialLabel = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'twitter': return 'Twitter';
      case 'github': return 'GitHub';
      case 'website': return 'Website';
      default: return platform;
    }
  };

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
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {speaker.profileImageUrl ? (
                <Image source={{ uri: speaker.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {speaker.firstName[0]}{speaker.lastName[0]}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.name}>
              {speaker.firstName} {speaker.lastName}
            </Text>
            
            {speaker.title && (
              <Text style={styles.title}>{speaker.title}</Text>
            )}
            
            {speaker.company && (
              <Text style={styles.company}>@{speaker.company}</Text>
            )}
          </View>

          {/* About Section */}
          {speaker.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{speaker.bio}</Text>
            </View>
          )}

          {/* Expertise Section */}
          {speaker.expertise && speaker.expertise.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expertise</Text>
              <View style={styles.expertiseContainer}>
                {speaker.expertise.map((skill, index) => (
                  <View key={index} style={styles.expertiseTag}>
                    <Text style={styles.expertiseText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            
            {speaker.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>📧</Text>
                <Text style={styles.contactText}>{speaker.email}</Text>
              </View>
            )}

            {speaker.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{speaker.phone}</Text>
              </View>
            )}

            {/* Social Links */}
            {Object.entries(speaker.socialLinks).map(([platform, url]) => {
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
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
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
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  expertiseText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
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

export default SpeakerModal;
