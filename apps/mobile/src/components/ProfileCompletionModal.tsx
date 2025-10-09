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
import { ProfileCompleteness } from '../services/profileService';

interface ProfileCompletionModalProps {
  visible: boolean;
  profileCompleteness: ProfileCompleteness;
  onClose: () => void;
  onCompleteProfile: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  visible,
  profileCompleteness,
  onClose,
  onCompleteProfile,
}) => {
  console.log('ProfileCompletionModal render:', { visible, profileCompleteness: profileCompleteness !== null });
  
  // Don't render if profileCompleteness is null
  if (!profileCompleteness) {
    console.log('ProfileCompletionModal: profileCompleteness is null, not rendering');
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              You need to complete your profile before you can RSVP to events.
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${profileCompleteness.completionPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {profileCompleteness.completionPercentage}% Complete
            </Text>
          </View>

          {/* Missing Fields */}
          <View style={styles.missingFieldsSection}>
            <Text style={styles.missingFieldsTitle}>Missing Required Fields:</Text>
            {profileCompleteness.missingFields.map((field, index) => (
              <View key={index} style={styles.missingFieldItem}>
                <Text style={styles.missingFieldBullet}>•</Text>
                <Text style={styles.missingFieldText}>{field}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={onCompleteProfile}
            >
              <Text style={styles.completeButtonText}>Complete Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  missingFieldsSection: {
    flex: 1,
    marginBottom: 30,
  },
  missingFieldsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  missingFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  missingFieldBullet: {
    fontSize: 16,
    color: '#dc3545',
    marginRight: 8,
    fontWeight: 'bold',
  },
  missingFieldText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileCompletionModal;
