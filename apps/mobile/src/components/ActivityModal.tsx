import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { RSVPService } from '../services/rsvpService';
import { SpeakersService, ActivitySpeaker } from '../services/speakersService';
import SpeakerModal from './SpeakerModal';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { name: string } | null;
  max_capacity: number | null;
  current_rsvps: number;
  is_required: boolean;
}

interface ActivityModalProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
  onRSVP: (activityId: string, status: 'attending' | 'not_attending') => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ActivityModal: React.FC<ActivityModalProps> = ({ visible, activity, onClose, onRSVP }) => {
  const [speakers, setSpeakers] = useState<ActivitySpeaker[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);

  // Load activity speakers when modal opens
  useEffect(() => {
    if (visible && activity) {
      loadActivitySpeakers();
    }
  }, [visible, activity]);

  const loadActivitySpeakers = async () => {
    if (!activity) return;
    
    try {
      const activitySpeakers = await SpeakersService.getActivitySpeakers(activity.id);
      setSpeakers(activitySpeakers);
    } catch (error) {
      console.error('Error loading activity speakers:', error);
    }
  };

  const handleSpeakerPress = (speaker: ActivitySpeaker) => {
    setSelectedSpeaker(speaker.speaker);
    setSpeakerModalVisible(true);
  };

  if (!activity) return null;

  const startDate = new Date(activity.start_time + 'Z');
  const endDate = new Date(activity.end_time + 'Z');
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  const handleRSVP = async (status: 'attending' | 'not_attending') => {
    try {
      await RSVPService.createActivityRSVP(activity.id, 'mock-user-id', status);
      onRSVP(activity.id, status);
    } catch (error) {
      console.error('Activity RSVP failed:', error);
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Activity Details */}
          <View style={styles.detailsContainer}>
            {/* Title and Required Badge */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.is_required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Required</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Date and Time */}
            <View style={styles.dateTimeSection}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.dateTimeLabel}>Start</Text>
                <Text style={styles.dateTimeValue}>
                  {formatDate(startDate)} at {formatTime(startDate)}
                </Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={styles.dateTimeLabel}>End</Text>
                <Text style={styles.dateTimeValue}>
                  {formatDate(endDate)} at {formatTime(endDate)}
                </Text>
              </View>
            </View>

            {/* Location */}
            {activity.location?.name && (
              <View style={styles.locationSection}>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{activity.location.name}</Text>
                </View>
              </View>
            )}

            {/* Activity Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={styles.infoValue}>
                  {activity.current_rsvps || 0} / {activity.max_capacity || '∞'} attendees
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>
                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this activity</Text>
              <Text style={styles.description}>
                {activity.description || 'No description available.'}
              </Text>
            </View>

            {/* Speakers Section */}
            {speakers.length > 0 && (
              <View style={styles.speakersSection}>
                <Text style={styles.sectionTitle}>Speakers for this session ({speakers.length})</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.speakersScrollView}
                  contentContainerStyle={styles.speakersScrollContent}
                >
                  {speakers.map((activitySpeaker) => (
                    <TouchableOpacity
                      key={activitySpeaker.id}
                      style={styles.speakerCard}
                      onPress={() => handleSpeakerPress(activitySpeaker)}
                    >
                      <View style={styles.speakerAvatar}>
                        {activitySpeaker.speaker?.profileImageUrl ? (
                          <Image 
                            source={{ uri: activitySpeaker.speaker.profileImageUrl }} 
                            style={styles.speakerAvatarImage} 
                          />
                        ) : (
                          <View style={styles.speakerAvatarPlaceholder}>
                            <Text style={styles.speakerAvatarText}>
                              {activitySpeaker.speaker?.firstName?.[0]}{activitySpeaker.speaker?.lastName?.[0]}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.speakerName} numberOfLines={1}>
                        {activitySpeaker.speaker?.firstName} {activitySpeaker.speaker?.lastName}
                      </Text>
                      <Text style={styles.speakerTitle} numberOfLines={1}>
                        {activitySpeaker.speaker?.title}
                      </Text>
                      <Text style={styles.speakerCompany} numberOfLines={1}>
                        @{activitySpeaker.speaker?.company}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Additional Info */}
            <View style={styles.additionalInfoSection}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>Activity Type</Text>
                  <Text style={styles.infoRowValue}>
                    {activity.is_required ? 'Required Activity' : 'Optional Activity'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>RSVP Status</Text>
                  <Text style={styles.infoRowValue}>Open</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* RSVP Footer */}
        <View style={styles.footer}>
          <View style={styles.rsvpButtons}>
            <TouchableOpacity
              style={[styles.rsvpButton, styles.notGoingButton]}
              onPress={() => handleRSVP('not_attending')}
            >
              <Text style={styles.notGoingButtonText}>Not Going</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rsvpButton, styles.goingButton]}
              onPress={() => handleRSVP('attending')}
            >
              <Text style={styles.goingButtonText}>RSVP Going</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>

    {/* Speaker Modal */}
    <SpeakerModal
      visible={speakerModalVisible}
      speaker={selectedSpeaker}
      onClose={() => setSpeakerModalVisible(false)}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requiredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  dateTimeSection: {
    marginBottom: 24,
    gap: 16,
  },
  dateTimeItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#111827',
  },
  locationSection: {
    marginBottom: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  additionalInfoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRowLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  notGoingButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  notGoingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  goingButton: {
    backgroundColor: '#111827',
  },
  goingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Speakers Section Styles
  speakersSection: {
    marginBottom: 24,
  },
  speakersScrollView: {
    marginTop: 12,
  },
  speakersScrollContent: {
    paddingRight: 20,
  },
  speakerCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  speakerAvatar: {
    marginBottom: 8,
  },
  speakerAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  speakerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  speakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  speakerTitle: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ActivityModal;
