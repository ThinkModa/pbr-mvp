import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AttendeesService, { EventAttendee } from '../services/attendeesService';
import AvatarComponent from './AvatarComponent';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface AttendeesContentProps {
  event: Event | null;
  onAttendeePress?: (attendee: EventAttendee) => void;
}

const AttendeesContent: React.FC<AttendeesContentProps> = ({ 
  event, 
  onAttendeePress,
}) => {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendees = useCallback(async () => {
    if (!event) return;
    
    try {
      setLoading(true);
      console.log('Loading attendees for event:', event.id);
      const eventAttendees = await AttendeesService.getEventAttendees(event.id);
      setAttendees(eventAttendees);
      console.log('✅ Loaded attendees:', eventAttendees.length);
    } catch (error) {
      console.error('Error loading attendees:', error);
      Alert.alert('Error', 'Failed to load attendees. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [event]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAttendees();
  }, [loadAttendees]);

  const handleAttendeePress = (attendee: EventAttendee) => {
    if (onAttendeePress) {
      onAttendeePress(attendee);
    }
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return '#10B981'; // Green
      case 'pending':
        return '#F59E0B'; // Yellow
      case 'not_attending':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'attending':
        return 'Attending';
      case 'pending':
        return 'Pending';
      case 'not_attending':
        return 'Not Attending';
      default:
        return status;
    }
  };

  const formatRSVPDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.eventBannerText}>👥 {event.title}</Text>
            <Text style={styles.eventBannerSubtext}>
              {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}
            </Text>
          </View>
        )}

        {/* Attendees Header */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Event Attendees</Text>
          <Text style={styles.sectionSubtitle}>
            People who have RSVP'd to this event
          </Text>
        </View>

        {/* Attendees List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading attendees...</Text>
          </View>
        ) : attendees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No attendees yet</Text>
            <Text style={styles.emptySubtext}>Be the first to RSVP!</Text>
          </View>
        ) : (
          <View style={styles.attendeesContainer}>
            {attendees.map((attendee) => (
              <TouchableOpacity
                key={attendee.id}
                style={styles.attendeeCard}
                onPress={() => handleAttendeePress(attendee)}
                activeOpacity={0.7}
              >
                <View style={styles.attendeeHeader}>
                  {/* Avatar */}
                  <View style={styles.avatarContainer}>
                    <AvatarComponent
                      name={getFullName(attendee.first_name, attendee.last_name)}
                      size={50}
                      fallbackText="??"
                      userPhotoUrl={attendee.avatar_url}
                    />
                  </View>

                  {/* Name and Title */}
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>
                      {attendee.first_name} {attendee.last_name}
                    </Text>
                    {attendee.title_position && (
                      <Text style={styles.attendeeTitle}>
                        {attendee.title_position}
                      </Text>
                    )}
                    {attendee.organization_affiliation && (
                      <Text style={styles.attendeeOrganization}>
                        {attendee.organization_affiliation}
                      </Text>
                    )}
                  </View>

                  {/* Status Badge */}
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(attendee.rsvp_status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(attendee.rsvp_status)}
                    </Text>
                  </View>
                </View>

                {/* Track Info */}
                {attendee.track_name && (
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackLabel}>Track:</Text>
                    <Text style={styles.trackName}>{attendee.track_name}</Text>
                  </View>
                )}

                {/* RSVP Date */}
                <View style={styles.rsvpInfo}>
                  <Text style={styles.rsvpDate}>
                    RSVP'd {formatRSVPDate(attendee.rsvp_created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6F1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  eventBanner: {
    backgroundColor: '#E0F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  eventBannerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C4B60',
    marginBottom: 4,
  },
  eventBannerSubtext: {
    fontSize: 14,
    color: '#0C4B60',
    opacity: 0.8,
  },
  headerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#265451',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  attendeesContainer: {
    // No specific styles needed here, children handle spacing
  },
  attendeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  attendeeInfo: {
    flex: 1,
    marginRight: 12,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  attendeeTitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  attendeeOrganization: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  trackLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 6,
  },
  trackName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
  rsvpInfo: {
    paddingHorizontal: 4,
  },
  rsvpDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default AttendeesContent;
