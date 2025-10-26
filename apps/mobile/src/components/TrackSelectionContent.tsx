import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { TrackService, EventTrack } from '../services/trackService';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface TrackSelectionContentProps {
  event: Event;
  onTrackSelected: (trackId: string) => void;
}

const TrackSelectionContent: React.FC<TrackSelectionContentProps> = ({ 
  event, 
  onTrackSelected
}) => {
  const { user } = useAuth();
  
  // State for tracks
  const [tracks, setTracks] = useState<EventTrack[]>([]);
  const [trackGroups, setTrackGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackActivities, setTrackActivities] = useState<{[trackId: string]: any[]}>({});

  useEffect(() => {
    if (event) {
      loadTracks();
    }
  }, [event]);

  const loadTracks = async () => {
    if (!event) return;
    
    try {
      setLoading(true);
      console.log('Loading tracks for event:', event.id);
      
      // Load tracks with groups
      const eventTracks = await TrackService.getEventTracksWithGroups(event.id);
      setTracks(eventTracks);
      
      // Load track groups
      const groups = await TrackService.getTrackGroups(event.id);
      setTrackGroups(groups);
      
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
      console.log('✅ Loaded track groups:', groups.length);
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

  const handleTrackSelect = (track: EventTrack) => {
    console.log('Track selected:', track.name);
    setSelectedTrack(track.id);
    
    // Check if this track is in a mutually exclusive group
    const trackGroup = trackGroups.find(group => group.id === track.track_group_id);
    let confirmationMessage = `Are you sure you want to select "${track.name}"?`;
    
    if (trackGroup && trackGroup.is_mutually_exclusive) {
      // Get all tracks in the same mutually exclusive group
      const tracksInSameGroup = tracks.filter(t => 
        t.track_group_id === trackGroup.id && t.id !== track.id
      );
      
      if (tracksInSameGroup.length > 0) {
        const otherTrackNames = tracksInSameGroup.map(t => t.name).join(', ');
        confirmationMessage = `You're selecting "${track.name}" from the "${trackGroup.name}" group. This is a mutually exclusive group, so selecting this track will hide activities from: ${otherTrackNames}. Are you sure?`;
      } else {
        confirmationMessage = `You're selecting "${track.name}" from the "${trackGroup.name}" group. This is a mutually exclusive group, meaning you can only select one track from this group. Are you sure?`;
      }
    }
    
    // Show confirmation alert
    Alert.alert(
      'Confirm Track Selection',
      confirmationMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setSelectedTrack(null)
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            onTrackSelected(track.id);
          }
        }
      ]
    );
  };

  const formatCapacity = (track: EventTrack) => {
    if (track.max_capacity === null) {
      return `${track.current_rsvps || 0} RSVPs`;
    }
    return `${track.current_rsvps || 0}/${track.max_capacity}`;
  };

  const getCapacityColor = (track: EventTrack) => {
    if (track.max_capacity === null) {
      return '#10B981'; // Green for unlimited
    }
    
    const percentage = (track.current_rsvps || 0) / (track.max_capacity || 1);
    if (percentage >= 1) {
      return '#EF4444'; // Red for full
    } else if (percentage >= 0.8) {
      return '#F59E0B'; // Yellow for nearly full
    } else {
      return '#10B981'; // Green for available
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
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
      <View style={styles.eventBanner}>
        <Text style={styles.eventBannerText}>🎯 {event.title}</Text>
      </View>

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
          {/* Render Track Groups */}
          {trackGroups.map((group) => {
            const groupTracks = tracks.filter(track => track.track_group_id === group.id);
            if (groupTracks.length === 0) return null;
            
            return (
              <View key={group.id} style={styles.trackGroupContainer}>
                <View style={styles.trackGroupHeader}>
                  <Text style={styles.trackGroupName}>{group.name}</Text>
                  {group.is_mutually_exclusive && (
                    <View style={styles.mutuallyExclusiveBadge}>
                      <Text style={styles.mutuallyExclusiveText}>Choose 1</Text>
                    </View>
                  )}
                </View>
                {group.description && (
                  <Text style={styles.trackGroupDescription}>{group.description}</Text>
                )}
                
                {groupTracks.map((track) => (
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
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
          
          {/* Render Independent Tracks (not in any group) */}
          {tracks.filter(track => !track.track_group_id).length > 0 && (
            <View style={styles.trackGroupContainer}>
              <View style={styles.trackGroupHeader}>
                <Text style={styles.trackGroupName}>Independent Tracks</Text>
              </View>
              <Text style={styles.trackGroupDescription}>
                These tracks can be selected independently
              </Text>
              
              {tracks.filter(track => !track.track_group_id).map((track) => (
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6F1',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  eventBanner: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  eventBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tracksContainer: {
    gap: 16,
  },
  trackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  trackName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  capacityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  trackDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
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
  // Track Group Styles
  trackGroupContainer: {
    marginBottom: 24,
  },
  trackGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackGroupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  trackGroupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  mutuallyExclusiveBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mutuallyExclusiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default TrackSelectionContent;
