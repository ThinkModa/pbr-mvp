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
  Alert,
  RefreshControl,
} from 'react-native';
import { TrackService, EventTrack } from '../services/trackService';
import { RSVPService } from '../services/rsvpService';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface TrackSelectionModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onTrackSelected: (trackId: string) => void;
  onBackToEvent?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TrackSelectionModal: React.FC<TrackSelectionModalProps> = ({ 
  visible, 
  event, 
  onClose, 
  onTrackSelected,
  onBackToEvent 
}) => {
  const { user } = useAuth();
  
  console.log('🎯 TrackSelectionModal render:', { 
    visible, 
    event: event?.title,
    eventId: event?.id
  });
  
  // Debug: Log when visible prop changes
  useEffect(() => {
    console.log('🎯 TrackSelectionModal visible prop changed:', visible);
  }, [visible]);
  
  // State for tracks
  const [tracks, setTracks] = useState<EventTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackActivities, setTrackActivities] = useState<{[trackId: string]: any[]}>({});

  // Load tracks when modal opens
  useEffect(() => {
    if (visible && event) {
      loadTracks();
    }
  }, [visible, event]);

  const loadTracks = async () => {
    if (!event) return;
    
    try {
      setLoading(true);
      console.log('Loading tracks for event:', event.id);
      const eventTracks = await TrackService.getEventTracksWithCapacity(event.id);
      setTracks(eventTracks);
      
      // Load activities for each track
      const activitiesMap: {[trackId: string]: any[]} = {};
      for (const track of eventTracks) {
        try {
          const activities = await TrackService.getTrackActivities(track.id);
          activitiesMap[track.id] = activities;
        } catch (error) {
          console.error(`Error loading activities for track ${track.id}:`, error);
          activitiesMap[track.id] = [];
        }
      }
      setTrackActivities(activitiesMap);
      
      console.log('✅ Loaded tracks:', eventTracks.length);
      console.log('✅ Loaded track activities:', activitiesMap);
    } catch (error) {
      console.error('Error loading tracks:', error);
      Alert.alert('Error', 'Failed to load tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTracks();
    setRefreshing(false);
  };

  const handleTrackSelect = async (track: EventTrack) => {
    if (!event || !user) return;
    
    try {
      console.log('Selecting track:', track.name);
      setSelectedTrack(track.id);
      
      // Check if track is at capacity
      const isAtCapacity = track.max_capacity && track.current_rsvps && 
                          track.current_rsvps >= track.max_capacity;
      
      if (isAtCapacity) {
        Alert.alert(
          'Track Full',
          `${track.name} is at capacity. Would you like to join the waitlist?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Join Waitlist', 
              onPress: () => confirmTrackSelection(track.id, 'waitlist')
            }
          ]
        );
      } else {
        // Confirm track selection
        Alert.alert(
          'Confirm Track Selection',
          `Are you sure you want to select "${track.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm', 
              onPress: () => confirmTrackSelection(track.id, 'attending')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting track:', error);
      Alert.alert('Error', 'Failed to select track. Please try again.');
    } finally {
      setSelectedTrack(null);
    }
  };

  const confirmTrackSelection = async (trackId: string, status: 'attending' | 'waitlist') => {
    if (!event || !user) return;
    
    try {
      console.log('Confirming track selection:', { trackId, status });
      
      // Confirm pending RSVP with track selection
      await RSVPService.confirmPendingRSVP(event.id, user.id, trackId);
      
      // Call the callback to update parent state
      onTrackSelected(trackId);
      
      // Show success message
      Alert.alert(
        'Track Selected!',
        `You've successfully selected your track for ${event.title}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error confirming track selection:', error);
      Alert.alert('Error', 'Failed to confirm track selection. Please try again.');
    }
  };

  const formatCapacity = (track: EventTrack) => {
    if (!track.max_capacity) {
      return 'Unlimited';
    }
    
    const current = track.current_rsvps || 0;
    const max = track.max_capacity;
    const remaining = max - current;
    
    if (remaining <= 0) {
      return 'Full';
    }
    
    return `${remaining} spots remaining`;
  };

  const getCapacityColor = (track: EventTrack) => {
    if (!track.max_capacity) {
      return '#10B981'; // Green for unlimited
    }
    
    const current = track.current_rsvps || 0;
    const max = track.max_capacity;
    const remaining = max - current;
    
    if (remaining <= 0) {
      return '#EF4444'; // Red for full
    } else if (remaining <= 5) {
      return '#F59E0B'; // Orange for almost full
    } else {
      return '#10B981'; // Green for available
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
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

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
              progressBackgroundColor="#FFFFFF"
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Event Title Banner */}
          {event && (
            <View style={styles.eventBanner}>
              <Text style={styles.eventBannerText}>🎯 {event.title}</Text>
            </View>
          )}

          {/* Track Selection Header */}
          <View style={styles.headerSection}>
            <Text style={styles.sectionTitle}>Select Your Track</Text>
            <Text style={styles.sectionSubtitle}>
              This event has multiple tracks running simultaneously. Please select the track you'd like to attend.
            </Text>
          </View>

          {/* Tracks List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading tracks...</Text>
            </View>
          ) : tracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tracks available</Text>
              <Text style={styles.emptySubtext}>Please contact the event organizer</Text>
            </View>
          ) : (
            <View style={styles.tracksContainer}>
              {tracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.trackCard,
                    selectedTrack === track.id && styles.trackCardSelected
                  ]}
                  onPress={() => handleTrackSelect(track)}
                  disabled={selectedTrack !== null}
                >
                  <View style={styles.trackHeader}>
                    <Text style={styles.trackName}>{track.name}</Text>
                    <View style={[
                      styles.capacityBadge,
                      { backgroundColor: getCapacityColor(track) }
                    ]}>
                      <Text style={styles.capacityText}>
                        {formatCapacity(track)}
                      </Text>
                    </View>
                  </View>
                  
                  {track.description && (
                    <Text style={styles.trackDescription}>
                      {track.description}
                    </Text>
                  )}
                  
                  {/* Activities for this track */}
                  {trackActivities[track.id] && trackActivities[track.id].length > 0 && (
                    <View style={styles.activitiesSection}>
                      <Text style={styles.activitiesTitle}>Activities ({trackActivities[track.id].length})</Text>
                      {trackActivities[track.id].map((activity, index) => (
                        <View key={activity.id || index} style={styles.activityItem}>
                          <Text style={styles.activityName}>{activity.title}</Text>
                          {activity.description && (
                            <Text style={styles.activityDescription} numberOfLines={2}>
                              {activity.description}
                            </Text>
                          )}
                          <Text style={styles.activityTime}>
                            {new Date(activity.start_time).toLocaleDateString()} •{' '}
                            {new Date(activity.start_time).toLocaleTimeString([], { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })} - {new Date(activity.end_time).toLocaleTimeString([], { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.trackFooter}>
                    <Text style={styles.trackCapacity}>
                      {track.current_rsvps || 0} / {track.max_capacity || '∞'} attendees
                    </Text>
                    <Text style={styles.selectButton}>Select Track →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Back to Event Button */}
          {onBackToEvent && (
            <TouchableOpacity style={styles.backButton} onPress={onBackToEvent}>
              <Text style={styles.backButtonText}>← Back to Event</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6F1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  eventBanner: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  eventBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  tracksContainer: {
    paddingHorizontal: 20,
  },
  trackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trackCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  capacityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capacityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  trackDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  trackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackCapacity: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  backButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activitiesSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  activityItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 6,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default TrackSelectionModal;
