import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/MockAuthContext';
import { EventsService, EventWithActivities } from '../services/eventsService';
import { RSVPService, RSVPStatus } from '../services/rsvpService';
import { SpeakersService, EventSpeaker } from '../services/speakersService';
import { BusinessesService, EventBusiness } from '../services/businessesService';
import { OrganizationsService, EventOrganization } from '../services/organizationsService';
import { ChatService, ChatThread, ChatMessage } from '../services/chatService';
import { RealTimeService } from '../services/realTimeService';
import { NotificationService } from '../services/notificationService';
import EventModal from './EventModal';
import ActivityModal from './ActivityModal';
import SpeakerModal from './SpeakerModal';
import BusinessModal from './BusinessModal';
import OrganizationModal from './OrganizationModal';

// Events Screen
const EventsScreen: React.FC<{ setCurrentScreen: (screen: string) => void }> = ({ setCurrentScreen }) => {
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<EventWithActivities[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Modal state management - single modal with different views
  const [modalVisible, setModalVisible] = useState(false);
  const [modalView, setModalView] = useState<'event' | 'activity'>('event');
  const [selectedEvent, setSelectedEvent] = useState<EventWithActivities | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [userRSVPs, setUserRSVPs] = useState<Record<string, RSVPStatus>>({});
  const [showMyEvents, setShowMyEvents] = useState(false);
  
  // Speaker state management
  const [eventSpeakers, setEventSpeakers] = useState<EventSpeaker[]>([]);
  const [activitySpeakers, setActivitySpeakers] = useState<EventSpeaker[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);
  
  // Business and Organization state management
  const [eventBusinesses, setEventBusinesses] = useState<EventBusiness[]>([]);
  const [eventOrganizations, setEventOrganizations] = useState<EventOrganization[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [selectedBusinessContacts, setSelectedBusinessContacts] = useState<any[]>([]);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);

  // Debug logging
  console.log('MainApp render:', { 
    modalVisible,
    modalView,
    event: selectedEvent?.title, 
    selectedActivity: selectedActivity?.title,
    selectedActivityId: selectedActivity?.id
  });
  
  // Additional debugging for modal state
  if (modalVisible && modalView === 'activity') {
    console.log('🎯 Activity view should be visible now!');
  }
  
  // Debug: Check modal state
  console.log('🎯 Modal state check:', {
    modalVisible,
    modalView,
    hasEvent: !!selectedEvent,
    hasActivity: !!selectedActivity
  });

  useEffect(() => {
    loadEvents();
  }, []);

        const loadEvents = async () => {
          try {
            setLoading(true);
            setError(null);
            const eventsData = await EventsService.getEvents();
            setEvents(eventsData);
            
            // Load user RSVPs if user is logged in
            if (user) {
              await loadUserRSVPs();
            }
            
            console.log('✅ Loaded', eventsData.length, 'events from live database');
          } catch (err) {
            setError('Failed to load events from live database. Please check your connection.');
            console.error('Error loading events from live database:', err);
          } finally {
            setLoading(false);
          }
        };

        const loadUserRSVPs = async () => {
          if (!user) return;
          
          try {
            const rsvps = await RSVPService.getUserEventRSVPs(user.id);
            const rsvpMap: Record<string, RSVPStatus> = {};
            rsvps.forEach(rsvp => {
              rsvpMap[rsvp.event_id] = rsvp.status;
            });
            setUserRSVPs(rsvpMap);
            console.log('✅ Loaded user RSVPs:', rsvpMap);
          } catch (error) {
            console.error('Error loading user RSVPs:', error);
          }
        };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const eventsData = await EventsService.getEvents();
      setEvents(eventsData);
      
      // Load user RSVPs if user is logged in
      if (user) {
        await loadUserRSVPs();
      }
      
      console.log('✅ Refreshed with live database data');
    } catch (err) {
      setError('Failed to refresh events from live database. Please check your connection.');
      console.error('Error refreshing events from live database:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEventPress = (event: EventWithActivities) => {
    console.log('🎯 Event pressed:', event.title);
    console.log('🎯 Setting selected event and modal visible');
    setSelectedEvent(event);
    setModalView('event');
    setModalVisible(true);
    // Load speakers, businesses, and organizations for this event
    loadEventSpeakers(event.id);
    loadEventBusinesses(event.id);
    loadEventOrganizations(event.id);
    console.log('🎯 Event view should be visible now');
  };

  const handleEventRSVP = async (eventId: string, status: 'attending' | 'not_attending' | null) => {
    console.log('Event RSVP:', eventId, status);
    
    // Update local RSVP state
    if (user) {
      setUserRSVPs(prev => {
        if (status === null) {
          // Remove the RSVP
          const newRSVPs = { ...prev };
          delete newRSVPs[eventId];
          return newRSVPs;
        } else {
          // Add or update the RSVP
          return {
            ...prev,
            [eventId]: status
          };
        }
      });
    }
    
    // Don't close the modal automatically - let user see the button state change
    // setModalVisible(false);
    // setSelectedEvent(null);
  };

  const handleActivityPress = (activity: any) => {
    console.log('🎯 Activity pressed in MainApp:', activity);
    console.log('🎯 Activity details:', {
      id: activity?.id,
      title: activity?.title,
      description: activity?.description,
      event_id: activity?.event_id
    });
    console.log('🎯 Current state before update:', {
      modalVisible,
      modalView,
      selectedActivity: selectedActivity?.title
    });
    console.log('🎯 Setting selectedActivity and switching to activity view...');
    setSelectedActivity(activity);
    setModalView('activity');
    // Load activity-specific speakers
    loadActivitySpeakers(activity.id);
    console.log('🎯 Activity view should be visible now - smooth transition');
  };

  // Load speakers for the current event
  const loadEventSpeakers = async (eventId: string) => {
    try {
      console.log('Loading speakers for event:', eventId);
      const speakers = await SpeakersService.getEventSpeakers(eventId);
      setEventSpeakers(speakers);
      console.log('✅ Loaded event speakers:', speakers.length);
    } catch (error) {
      console.error('Error loading event speakers:', error);
      setEventSpeakers([]);
    }
  };

  // Load speakers for the current activity
  const loadActivitySpeakers = async (activityId: string) => {
    try {
      console.log('Loading speakers for activity:', activityId);
      const speakers = await SpeakersService.getActivitySpeakers(activityId);
      setActivitySpeakers(speakers);
      console.log('✅ Loaded activity speakers:', speakers.length);
    } catch (error) {
      console.error('Error loading activity speakers:', error);
      setActivitySpeakers([]);
    }
  };

  // Handle speaker press
  const handleSpeakerPress = (speaker: any) => {
    console.log('Speaker pressed:', speaker);
    setSelectedSpeaker(speaker);
    setSpeakerModalVisible(true);
  };

  // Load businesses and organizations for the current event
  const loadEventBusinesses = async (eventId: string) => {
    try {
      console.log('Loading businesses for event:', eventId);
      const businesses = await BusinessesService.getEventBusinesses(eventId);
      setEventBusinesses(businesses);
      console.log('✅ Loaded event businesses:', businesses.length);
    } catch (error) {
      console.error('Error loading event businesses:', error);
      setEventBusinesses([]);
    }
  };

  const loadEventOrganizations = async (eventId: string) => {
    try {
      console.log('Loading organizations for event:', eventId);
      const organizations = await OrganizationsService.getEventOrganizations(eventId);
      setEventOrganizations(organizations);
      console.log('✅ Loaded event organizations:', organizations.length);
    } catch (error) {
      console.error('Error loading event organizations:', error);
      setEventOrganizations([]);
    }
  };

  // Handle business press
  const handleBusinessPress = (business: any) => {
    console.log('Business pressed:', business);
    setSelectedBusiness(business.business);
    setSelectedBusinessContacts(business.contacts || []);
    setBusinessModalVisible(true);
  };

  // Handle organization press
  const handleOrganizationPress = (organization: any) => {
    console.log('Organization pressed:', organization);
    setSelectedOrganization(organization.organization);
    setOrganizationModalVisible(true);
  };

  const toggleMyEvents = () => {
    setShowMyEvents(!showMyEvents);
  };

  const getFilteredEvents = () => {
    if (!showMyEvents || !user) {
      return events;
    }
    
    return events.filter(event => userRSVPs[event.id]);
  };

  const renderEvent = ({ item }: { item: EventWithActivities }) => {
    // Parse dates correctly to avoid timezone issues
    const startDate = new Date(item.start_time + 'Z'); // Add Z to treat as UTC
    const endDate = new Date(item.end_time + 'Z'); // Add Z to treat as UTC
    
    // Format date without timezone conversion
    const dateStr = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC' // Use UTC to avoid timezone shifts
    });
    
    const timeStr = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;
    const location = item.location?.name || 'Location TBD';
    
    // Respect visibility settings - only show if visible
    const showPrice = item.show_price !== false && (item.is_free || item.price);
    const showCapacity = item.show_capacity !== false && item.max_capacity;
    const showAttendeeCount = item.show_attendee_count !== false;
    
    // Get user's RSVP status for this event
    const userRSVP = userRSVPs[item.id];
    
    const price = item.is_free ? 'Free' : `$${((item.price || 0) / 100).toFixed(2)}`;
    const attendees = item.current_rsvps || 0;
    const capacity = ` / ${item.max_capacity}`;

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => {
          console.log('🔥 TouchableOpacity onPress triggered for:', item.title);
          handleEventPress(item);
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={styles.eventBadges}>
            {userRSVP && (
              <View style={[
                styles.rsvpBadge, 
                { backgroundColor: userRSVP === 'attending' ? '#10B981' : userRSVP === 'not_attending' ? '#EF4444' : '#F59E0B' }
              ]}>
                <Text style={styles.rsvpBadgeText}>
                  {userRSVP === 'attending' ? 'Going' : 
                   userRSVP === 'not_attending' ? 'Not Going' : 
                   userRSVP === 'maybe' ? 'Maybe' : 'Waitlist'}
                </Text>
              </View>
            )}
            <View style={[styles.eventTypeBadge, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.eventTypeText}>Event</Text>
            </View>
          </View>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventDetail}>📅 {dateStr} at {timeStr}</Text>
          <Text style={styles.eventDetail}>📍 {location}</Text>
          {showAttendeeCount && (
            <Text style={styles.eventDetail}>
              👥 {attendees}{showCapacity ? capacity : ''} attendees
            </Text>
          )}
          {showPrice && (
            <Text style={styles.eventDetail}>💰 {price}</Text>
          )}
        </View>
        {item.activities && item.activities.length > 0 && (
          <View style={styles.activitiesSection}>
            <Text style={styles.activitiesTitle}>Activities ({item.activities.length})</Text>
            {item.activities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Text style={styles.activityName}>• {activity.title}</Text>
              </View>
            ))}
            {item.activities.length > 3 && (
              <View style={styles.activityItem}>
                <Text style={styles.activityName}>• +{item.activities.length - 3} more activities</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.eventCardFooter}>
          <Text style={styles.tapToViewText}>Tap to view details</Text>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading events from live database...</Text>
              </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Events</Text>
                <View style={[styles.dataSourceIndicator, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.dataSourceText}>
                    LIVE
                  </Text>
                </View>
        </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.myEventsButton, showMyEvents && styles.myEventsButtonActive]}
                  onPress={toggleMyEvents}
                >
                  <Text style={[styles.myEventsButtonText, showMyEvents && styles.myEventsButtonTextActive]}>
                    {showMyEvents ? 'All Events' : 'My Events'}
                  </Text>
                </TouchableOpacity>

              </View>
      </View>
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events available</Text>
          <Text style={styles.emptySubtext}>Check back later for upcoming events</Text>
        </View>
            ) : (
              <FlatList
                data={getFilteredEvents()}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.eventsList}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                removeClippedSubviews={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3B82F6']}
                    tintColor="#3B82F6"
                  />
                }
              />
            )}
      
      {/* Single Modal with Conditional Content - No Nested Modals */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (modalView === 'activity') {
            setModalView('event');
            setSelectedActivity(null);
          } else {
            setModalVisible(false);
            setSelectedEvent(null);
          }
        }}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <TouchableOpacity 
              onPress={() => {
                if (modalView === 'activity') {
                  setModalView('event');
                  setSelectedActivity(null);
                } else {
                  setModalVisible(false);
                  setSelectedEvent(null);
                }
              }} 
              style={{ padding: 10 }}
            >
              <Text style={{ fontSize: 18, color: '#265451' }}>✕</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={{ padding: 10 }}>
                <Text style={{ fontSize: 18, color: '#265451' }}>↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            bounces={true}
            alwaysBounceVertical={true}
          >
            {modalView === 'event' && selectedEvent ? (
              <View>
                {/* Event Image */}
                <View style={{ height: 200, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                  {selectedEvent.cover_image_url ? (
                    <Image
                      source={{ uri: selectedEvent.cover_image_url }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 48, color: '#9CA3AF' }}>📅</Text>
                  )}
                </View>

                {/* Enhanced Event Banner - Airbnb Style */}
                <View style={{ padding: 20, paddingBottom: 0 }}>
                  {/* Centered Event Title */}
                  <Text style={{ 
                    fontSize: 28, 
                    fontWeight: 'bold', 
                    color: '#111827', 
                    textAlign: 'center',
                    marginBottom: 8
                  }}>
                    {selectedEvent.title}
                  </Text>
                  
                  {/* Event Description */}
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#6B7280', 
                    textAlign: 'center',
                    lineHeight: 22
                  }}>
                    {selectedEvent.description || 'Event details'}
                  </Text>
                </View>

                {/* Event Details */}
                <View style={{ padding: 20 }}>
                  {/* Location */}
                  <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16, color: '#666', marginRight: 8 }}>📍</Text>
                      <Text style={{ fontSize: 16, color: '#666' }}>
                        {selectedEvent.location?.name || 'Location TBD'}
                      </Text>
                    </View>
                  </View>

                  {/* Capacity/Attendees/Cost Section - Airbnb Style with Separators */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: 20,
                    paddingVertical: 12
                  }}>
                    {/* Capacity */}
                    {selectedEvent?.show_capacity !== false && (
                      <>
                        <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600' }}>
                          {selectedEvent?.max_capacity || '∞'} capacity
                        </Text>
                        <View style={{ width: 1, height: 16, backgroundColor: '#D1D5DB', marginHorizontal: 12 }} />
                      </>
                    )}
                    
                    {/* Attendee Count */}
                    {selectedEvent?.show_attendee_count !== false && (
                      <>
                        <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600' }}>
                          {selectedEvent?.current_rsvps || 0} registered
                        </Text>
                        <View style={{ width: 1, height: 16, backgroundColor: '#D1D5DB', marginHorizontal: 12 }} />
                      </>
                    )}
                    
                    {/* Cost */}
                    {selectedEvent?.show_price !== false && (selectedEvent?.is_free || selectedEvent?.price) && (
                      <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600' }}>
                        {selectedEvent?.is_free ? 'Free' : `$${((selectedEvent?.price || 0) / 100).toFixed(2)}`}
                      </Text>
                    )}
                  </View>

                  {/* Start Date Shadow Card */}
                  <View style={{ 
                    backgroundColor: 'white', 
                    padding: 15, 
                    borderRadius: 12, 
                    marginBottom: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: '#9CA3AF', marginRight: 8 }}>📅</Text>
                      <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Start Date</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                      {new Date(selectedEvent.start_time + 'Z').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                      {new Date(selectedEvent.start_time + 'Z').toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'UTC'
                      })}
                    </Text>
                  </View>

                  {/* End Date Shadow Card */}
                  <View style={{ 
                    backgroundColor: 'white', 
                    padding: 15, 
                    borderRadius: 12, 
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: '#9CA3AF', marginRight: 8 }}>🏁</Text>
                      <Text style={{ fontSize: 14, color: '#9CA3AF' }}>End Date</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                      {new Date(selectedEvent.end_time + 'Z').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                      {new Date(selectedEvent.end_time + 'Z').toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'UTC'
                      })}
                    </Text>
                  </View>

                  {/* Activities */}
                  {selectedEvent.activities && selectedEvent.activities.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                        Activities ({selectedEvent.activities.length})
                      </Text>
                      {(() => {
                        // Group activities by date
                        const activitiesByDate = selectedEvent.activities.reduce((groups, activity) => {
                          const date = new Date(activity.start_time + 'Z').toDateString();
                          if (!groups[date]) {
                            groups[date] = [];
                          }
                          groups[date].push(activity);
                          return groups;
                        }, {} as Record<string, typeof selectedEvent.activities>);

                        // Sort dates
                        const sortedDates = Object.keys(activitiesByDate).sort((a, b) => 
                          new Date(a).getTime() - new Date(b).getTime()
                        );

                        return sortedDates.map((dateString) => {
                          const activities = activitiesByDate[dateString];
                          const date = new Date(dateString);
                          
                          return (
                            <View key={dateString} style={{ marginBottom: 20 }}>
                              {/* Date Header */}
                              <Text style={{ 
                                fontSize: 16, 
                                fontWeight: 'bold', 
                                color: '#111827', 
                                marginBottom: 12,
                                paddingHorizontal: 4
                              }}>
                                {date.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Text>
                              {/* Date Separator */}
                              <View style={{ 
                                height: 1, 
                                backgroundColor: '#E5E7EB', 
                                marginBottom: 12,
                                marginHorizontal: 4
                              }} />
                              
                              {/* Activities for this date */}
                              {activities.map((activity, activityIndex) => (
                                <TouchableOpacity
                                  key={activity.id}
                                  style={{ 
                                    backgroundColor: 'white', 
                                    padding: 15, 
                                    borderRadius: 12, 
                                    marginBottom: activityIndex === activities.length - 1 ? 0 : 10,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 3,
                                  }}
                                  onPress={() => handleActivityPress(activity)}
                                >
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                                        {activity.title}
                                      </Text>
                                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                                        {new Date(activity.start_time + 'Z').toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          timeZone: 'UTC'
                                        })} - {new Date(activity.end_time + 'Z').toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          timeZone: 'UTC'
                                        })}
                                      </Text>
                                    </View>
                                    <Text style={{ fontSize: 18, color: '#9CA3AF' }}>›</Text>
                                  </View>
                                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }} numberOfLines={2}>
                                    {activity.description || 'No description available.'}
                                  </Text>
                                  {activity.location?.name && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={{ fontSize: 14, color: '#6B7280', marginRight: 4 }}>📍</Text>
                                      <Text style={{ fontSize: 14, color: '#6B7280' }}>{activity.location.name}</Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                          );
                        });
                      })()}
                    </View>
                  )}

                  {/* Speakers Section */}
                  {eventSpeakers.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                        Speakers ({eventSpeakers.length})
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 10 }}
                        contentContainerStyle={{ paddingRight: 20 }}
                      >
                        {eventSpeakers.map((eventSpeaker) => (
                          <TouchableOpacity
                            key={eventSpeaker.id}
                            style={{ 
                              backgroundColor: 'white', 
                              padding: 15, 
                              borderRadius: 12, 
                              marginRight: 12,
                              width: 120,
                              alignItems: 'center',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 3,
                            }}
                            onPress={() => handleSpeakerPress(eventSpeaker)}
                          >
                            <View style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: 30, 
                              backgroundColor: '#F3F4F6', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              marginBottom: 10
                            }}>
                              {eventSpeaker.speaker?.profileImageUrl ? (
                                <Image 
                                  source={{ uri: eventSpeaker.speaker.profileImageUrl }} 
                                  style={{ width: 60, height: 60, borderRadius: 30 }} 
                                />
                              ) : (
                                <Text style={{ fontSize: 20, color: '#6B7280', fontWeight: 'bold' }}>
                                  {eventSpeaker.speaker?.firstName?.[0]}{eventSpeaker.speaker?.lastName?.[0]}
                                </Text>
                              )}
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={1}>
                              {eventSpeaker.speaker?.firstName} {eventSpeaker.speaker?.lastName}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 2 }} numberOfLines={1}>
                              {eventSpeaker.speaker?.title}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }} numberOfLines={1}>
                              @{eventSpeaker.speaker?.company}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Sponsors Section (Businesses + Organizations with is_sponsor=true) */}
                  {(() => {
                    const sponsorBusinesses = eventBusinesses.filter(b => b.business?.isSponsor === true);
                    const sponsorOrganizations = eventOrganizations.filter(o => o.organization?.isSponsor === true);
                    const totalSponsors = sponsorBusinesses.length + sponsorOrganizations.length;
                    
                    return totalSponsors > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                          🏢 Sponsors ({totalSponsors})
                        </Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={{ marginBottom: 10 }}
                          contentContainerStyle={{ paddingRight: 20 }}
                        >
                          {/* Render Sponsor Businesses */}
                          {sponsorBusinesses.map((eventBusiness) => (
                            <TouchableOpacity
                              key={`business-${eventBusiness.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleBusinessPress(eventBusiness)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventBusiness.business?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventBusiness.business.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventBusiness.business?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventBusiness.business?.name}
                              </Text>
                              {eventBusiness.sponsorshipLevel && (
                                <Text style={{ fontSize: 12, color: '#D29507', textAlign: 'center', fontWeight: '600' }}>
                                  {eventBusiness.sponsorshipLevel} Sponsor
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                          
                          {/* Render Sponsor Organizations */}
                          {sponsorOrganizations.map((eventOrganization) => (
                            <TouchableOpacity
                              key={`organization-${eventOrganization.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleOrganizationPress(eventOrganization)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventOrganization.organization?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventOrganization.organization.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventOrganization.organization?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventOrganization.organization?.name}
                              </Text>
                              {eventOrganization.sponsorshipLevel && (
                                <Text style={{ fontSize: 12, color: '#D29507', textAlign: 'center', fontWeight: '600' }}>
                                  {eventOrganization.sponsorshipLevel} Sponsor
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })()}

                  {/* Vendors Section (Businesses + Organizations with is_sponsor=false/null) */}
                  {(() => {
                    const vendorBusinesses = eventBusinesses.filter(b => b.business?.isSponsor !== true);
                    const vendorOrganizations = eventOrganizations.filter(o => o.organization?.isSponsor !== true);
                    const totalVendors = vendorBusinesses.length + vendorOrganizations.length;
                    
                    return totalVendors > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                          Vendors ({totalVendors})
                        </Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={{ marginBottom: 10 }}
                          contentContainerStyle={{ paddingRight: 20 }}
                        >
                          {/* Render Vendor Businesses */}
                          {vendorBusinesses.map((eventBusiness) => (
                            <TouchableOpacity
                              key={`business-${eventBusiness.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleBusinessPress(eventBusiness)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventBusiness.business?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventBusiness.business.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventBusiness.business?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventBusiness.business?.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', fontWeight: '500' }}>
                                Vendor
                              </Text>
                            </TouchableOpacity>
                          ))}
                          
                          {/* Render Vendor Organizations */}
                          {vendorOrganizations.map((eventOrganization) => (
                            <TouchableOpacity
                              key={`organization-${eventOrganization.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleOrganizationPress(eventOrganization)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventOrganization.organization?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventOrganization.organization.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventOrganization.organization?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventOrganization.organization?.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', fontWeight: '500' }}>
                                Vendor
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })()}
                </View>
              </View>
            ) : modalView === 'activity' && selectedActivity ? (
              <View>
                {/* Event Banner */}
                {selectedEvent && (
                  <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, margin: 20, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {selectedEvent.cover_image_url ? (
                      <Image
                        source={{ uri: selectedEvent.cover_image_url }}
                        style={{ width: 24, height: 24, borderRadius: 4 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ fontSize: 16, color: '#6B7280' }}>📅</Text>
                    )}
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', flex: 1 }}>
                      {selectedEvent.title}
                    </Text>
                  </View>
                )}

                <View style={{ padding: 20 }}>
                  {/* Activity Title */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#265451', marginBottom: 10 }}>
                      {selectedActivity.title}
                    </Text>
                    {selectedActivity.is_required && (
                      <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '600' }}>Required</Text>
                      </View>
                    )}
                  </View>

                  {/* Date and Time */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, color: '#333' }}>
                      📅 {new Date(selectedActivity.start_time + 'Z').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })} • {new Date(selectedActivity.start_time + 'Z').toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'UTC'
                      })} - {new Date(selectedActivity.end_time + 'Z').toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'UTC'
                      })}
                    </Text>
                  </View>

                  {/* Location */}
                  {selectedActivity.location?.name && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 16, color: '#333' }}>
                        📍 {selectedActivity.location.name}
                      </Text>
                    </View>
                  )}

                  {/* Activity Info */}
                  <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontSize: 14, color: '#9CA3AF' }}>⏱️ Duration</Text>
                      <Text style={{ fontSize: 16, color: '#333' }}>
                        {Math.round((new Date(selectedActivity.end_time + 'Z').getTime() - new Date(selectedActivity.start_time + 'Z').getTime()) / (1000 * 60))} minutes
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, color: '#9CA3AF' }}>👥 Capacity</Text>
                      <Text style={{ fontSize: 16, color: '#333' }}>
                        {selectedActivity.current_rsvps || 0} / {selectedActivity.max_capacity || '∞'} attendees
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, color: '#333', lineHeight: 24 }}>
                      {selectedActivity.description || 'No description available.'}
                    </Text>
                  </View>

                  {/* Activity Speakers Section */}
                  {activitySpeakers.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                        👥 Speakers ({activitySpeakers.length})
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 10 }}
                        contentContainerStyle={{ paddingRight: 20 }}
                      >
                        {activitySpeakers.map((activitySpeaker) => (
                          <TouchableOpacity
                            key={activitySpeaker.id}
                            style={{ 
                              backgroundColor: 'white', 
                              padding: 15, 
                              borderRadius: 12, 
                              marginRight: 12,
                              width: 120,
                              alignItems: 'center',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 3,
                            }}
                            onPress={() => handleSpeakerPress(activitySpeaker)}
                          >
                            <View style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: 30, 
                              backgroundColor: '#F3F4F6', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              marginBottom: 10
                            }}>
                              {activitySpeaker.speaker?.profileImageUrl ? (
                                <Image 
                                  source={{ uri: activitySpeaker.speaker.profileImageUrl }} 
                                  style={{ width: 60, height: 60, borderRadius: 30 }} 
                                />
                              ) : (
                                <Text style={{ fontSize: 20, color: '#6B7280', fontWeight: 'bold' }}>
                                  {activitySpeaker.speaker?.firstName?.[0]}{activitySpeaker.speaker?.lastName?.[0]}
                                </Text>
                              )}
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={1}>
                              {activitySpeaker.speaker?.firstName} {activitySpeaker.speaker?.lastName}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 2 }} numberOfLines={1}>
                              {activitySpeaker.speaker?.title}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }} numberOfLines={1}>
                              @{activitySpeaker.speaker?.company}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Event Sponsors Section (showing event sponsors in activity view) */}
                  {(() => {
                    const sponsorBusinesses = eventBusinesses.filter(b => b.business?.isSponsor === true);
                    const sponsorOrganizations = eventOrganizations.filter(o => o.organization?.isSponsor === true);
                    const totalSponsors = sponsorBusinesses.length + sponsorOrganizations.length;
                    
                    return totalSponsors > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                          🏢 Sponsors ({totalSponsors})
                        </Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={{ marginBottom: 10 }}
                          contentContainerStyle={{ paddingRight: 20 }}
                        >
                          {/* Render Sponsor Businesses */}
                          {sponsorBusinesses.map((eventBusiness) => (
                            <TouchableOpacity
                              key={`business-${eventBusiness.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleBusinessPress(eventBusiness)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventBusiness.business?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventBusiness.business.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventBusiness.business?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventBusiness.business?.name}
                              </Text>
                              {eventBusiness.sponsorshipLevel && (
                                <Text style={{ fontSize: 12, color: '#D29507', textAlign: 'center', fontWeight: '600' }}>
                                  {eventBusiness.sponsorshipLevel} Sponsor
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                          
                          {/* Render Sponsor Organizations */}
                          {sponsorOrganizations.map((eventOrganization) => (
                            <TouchableOpacity
                              key={`organization-${eventOrganization.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleOrganizationPress(eventOrganization)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventOrganization.organization?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventOrganization.organization.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventOrganization.organization?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventOrganization.organization?.name}
                              </Text>
                              {eventOrganization.sponsorshipLevel && (
                                <Text style={{ fontSize: 12, color: '#D29507', textAlign: 'center', fontWeight: '600' }}>
                                  {eventOrganization.sponsorshipLevel} Sponsor
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })()}

                  {/* Event Vendors Section (showing event vendors in activity view) */}
                  {(() => {
                    const vendorBusinesses = eventBusinesses.filter(b => b.business?.isSponsor !== true);
                    const vendorOrganizations = eventOrganizations.filter(o => o.organization?.isSponsor !== true);
                    const totalVendors = vendorBusinesses.length + vendorOrganizations.length;
                    
                    return totalVendors > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#265451', marginBottom: 15 }}>
                          Vendors ({totalVendors})
                        </Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={{ marginBottom: 10 }}
                          contentContainerStyle={{ paddingRight: 20 }}
                        >
                          {/* Render Vendor Businesses */}
                          {vendorBusinesses.map((eventBusiness) => (
                            <TouchableOpacity
                              key={`business-${eventBusiness.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleBusinessPress(eventBusiness)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventBusiness.business?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventBusiness.business.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventBusiness.business?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventBusiness.business?.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', fontWeight: '500' }}>
                                Vendor
                              </Text>
                            </TouchableOpacity>
                          ))}
                          
                          {/* Render Vendor Organizations */}
                          {vendorOrganizations.map((eventOrganization) => (
                            <TouchableOpacity
                              key={`organization-${eventOrganization.id}`}
                              style={{ 
                                backgroundColor: 'white', 
                                padding: 15, 
                                borderRadius: 12, 
                                marginRight: 12,
                                width: 120,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                              onPress={() => handleOrganizationPress(eventOrganization)}
                            >
                              <View style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 8, 
                                backgroundColor: '#F3F4F6', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginBottom: 10
                              }}>
                                {eventOrganization.organization?.logoUrl ? (
                                  <Image 
                                    source={{ uri: eventOrganization.organization.logoUrl }} 
                                    style={{ width: 60, height: 60, borderRadius: 8 }} 
                                  />
                                ) : (
                                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>
                                    {eventOrganization.organization?.name?.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>
                                {eventOrganization.organization?.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', fontWeight: '500' }}>
                                Vendor
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })()}
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: 16, color: '#6B7280' }}>
                  Loading...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* RSVP Footer */}
          <View style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: 'white', 
            borderTopWidth: 1, 
            borderTopColor: '#E5E7EB',
            paddingHorizontal: 20,
            paddingVertical: 15,
            paddingBottom: 35 // Extra padding for safe area
          }}>
            {modalView === 'event' && selectedEvent ? (
              <TouchableOpacity
                style={{ 
                  backgroundColor: userRSVPs[selectedEvent.id] === 'attending' ? '#DC2626' : '#D29507', 
                  paddingVertical: 15, 
                  borderRadius: 8, 
                  alignItems: 'center'
                }}
                onPress={() => {
                  if (userRSVPs[selectedEvent.id] === 'attending') {
                    // Show confirmation modal for removal
                    Alert.alert(
                      'Remove RSVP',
                      'Are you sure you won\'t be attending this event?',
                      [
                        {
                          text: 'No',
                          style: 'cancel',
                        },
                        {
                          text: 'Yes',
                          style: 'destructive',
                          onPress: () => handleEventRSVP(selectedEvent.id, null),
                        },
                      ]
                    );
                  } else {
                    handleEventRSVP(selectedEvent.id, 'attending');
                  }
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  {userRSVPs[selectedEvent.id] === 'attending' ? 'Remove RSVP' : 'RSVP here'}
                </Text>
              </TouchableOpacity>
            ) : modalView === 'activity' && selectedActivity ? (
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#D29507', 
                  paddingVertical: 15, 
                  borderRadius: 8, 
                  alignItems: 'center'
                }}
                onPress={() => {
                  console.log('Activity RSVP:', selectedActivity.id, 'attending');
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  RSVP for Activity
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Speaker Modal */}
      <SpeakerModal
        visible={speakerModalVisible}
        speaker={selectedSpeaker}
        onClose={() => setSpeakerModalVisible(false)}
      />

      {/* Business Modal */}
      <BusinessModal
        visible={businessModalVisible}
        business={selectedBusiness}
        contacts={selectedBusinessContacts}
        onClose={() => setBusinessModalVisible(false)}
      />

      {/* Organization Modal */}
      <OrganizationModal
        visible={organizationModalVisible}
        organization={selectedOrganization}
        onClose={() => setOrganizationModalVisible(false)}
      />

      {/* Floating Action Button for Create Event - Only show for admins */}
      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={() => {
            // TODO: Implement create event functionality
            Alert.alert('Create Event', 'Event creation functionality coming soon!');
          }}
        >
          <Text style={styles.floatingActionButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// Profile Screen
const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [userRSVPs, setUserRSVPs] = useState<Record<string, RSVPStatus>>({});
  const [rsvpEvents, setRsvpEvents] = useState<EventWithActivities[]>([]);
  const [loadingRSVPs, setLoadingRSVPs] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserRSVPs();
    }
  }, [user]);

  const loadUserRSVPs = async () => {
    if (!user) return;
    
    setLoadingRSVPs(true);
    try {
      const rsvps = await RSVPService.getUserEventRSVPs(user.id);
      const rsvpMap: Record<string, RSVPStatus> = {};
      rsvps.forEach(rsvp => {
        rsvpMap[rsvp.event_id] = rsvp.status;
      });
      setUserRSVPs(rsvpMap);
      
      // Load event details for RSVP'd events
      const eventIds = Object.keys(rsvpMap);
      if (eventIds.length > 0) {
        const allEvents = await EventsService.getEvents();
        const rsvpEventsData = allEvents.filter(event => eventIds.includes(event.id));
        setRsvpEvents(rsvpEventsData);
      }
      
      console.log('✅ Loaded user RSVPs for profile:', rsvpMap);
    } catch (error) {
      console.error('Error loading user RSVPs for profile:', error);
    } finally {
      setLoadingRSVPs(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.profileContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120x120' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileTitle}>
              {user?.role === 'business' ? 'Business User' : 'General User'}
            </Text>
            <Text style={styles.profileCompany}>Plant Build Restore</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{user?.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Role</Text>
            <Text style={styles.contactValue}>
              {user?.role === 'business' ? 'Business User' : 'General User'}
            </Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Member Since</Text>
            <Text style={styles.contactValue}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

              {/* RSVP Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My RSVPs</Text>
                {loadingRSVPs ? (
                  <Text style={styles.loadingText}>Loading RSVPs...</Text>
                ) : rsvpEvents.length === 0 ? (
                  <Text style={styles.emptyText}>No RSVPs yet</Text>
                ) : (
                  <View style={styles.rsvpSummary}>
                    {rsvpEvents.map(event => {
                      const rsvpStatus = userRSVPs[event.id];
                      const startDate = new Date(event.start_time + 'Z');
                      const dateStr = startDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC'
                      });
                      
                      return (
                        <View key={event.id} style={styles.rsvpItem}>
                          <View style={styles.rsvpItemHeader}>
                            <Text style={styles.rsvpEventTitle}>{event.title}</Text>
                            <View style={[
                              styles.rsvpStatusBadge,
                              { backgroundColor: rsvpStatus === 'attending' ? '#10B981' : rsvpStatus === 'not_attending' ? '#EF4444' : '#F59E0B' }
                            ]}>
                              <Text style={styles.rsvpStatusBadgeText}>
                                {rsvpStatus === 'attending' ? 'Going' : 
                                 rsvpStatus === 'not_attending' ? 'Not Going' : 
                                 rsvpStatus === 'maybe' ? 'Maybe' : 'Waitlist'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.rsvpEventDate}>📅 {dateStr}</Text>
                          <Text style={styles.rsvpEventLocation}>📍 {event.location?.name || 'Location TBD'}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Profile Actions */}
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.profileActionButton}>
                  <Text style={styles.profileActionButtonText}>Settings</Text>
                </TouchableOpacity>
              </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Chat Screen
const ChatScreen: React.FC<{ setCurrentScreen: (screen: string) => void }> = ({ setCurrentScreen }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'group' | 'direct'>('notifications');
  const [groupFilter, setGroupFilter] = useState<'events' | 'users'>('events');
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState<'group' | 'direct' | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  
  // Name Chat State
  const [chatName, setChatName] = useState('');
  
  // User Selection Modal Flow State
  const [userSelectionStep, setUserSelectionStep] = useState<'select' | 'name'>('select');

  // Load threads when tab changes
  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [activeTab, groupFilter, user]);

  const loadThreads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let threadsData: any[] = [];
      
      if (activeTab === 'notifications') {
        // Load notification threads (event threads that are read-only)
        threadsData = await ChatService.getUserThreads(user.id, 'announcements');
      } else if (activeTab === 'group') {
        // Load group chat threads
        threadsData = await ChatService.getUserThreads(user.id, 'group');
        
        // Filter by events vs users
        if (groupFilter === 'events') {
          threadsData = threadsData.filter(thread => thread.eventId);
        } else {
          threadsData = threadsData.filter(thread => !thread.eventId);
        }
      } else if (activeTab === 'direct') {
        // Load direct message threads
        threadsData = await ChatService.getUserThreads(user.id, 'direct');
      }
      
      setThreads(threadsData);
      console.log(`✅ Loaded ${threadsData.length} ${activeTab} threads`);
    } catch (err) {
      console.error('Error loading threads:', err);
      setError('Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getDisplayName = (thread: any): string => {
    if (activeTab === 'notifications' && thread.event) {
      return thread.event.title;
    } else if (activeTab === 'direct' && thread.otherUser) {
      return thread.otherUser.name;
    } else if (thread.name) {
      return thread.name;
    }
    return 'Unnamed Chat';
  };

  const getDisplaySubtitle = (thread: any): string => {
    if (activeTab === 'notifications' && thread.event) {
      return new Date(thread.event.start_time).toLocaleDateString();
    } else if (activeTab === 'direct' && thread.otherUser) {
      return thread.otherUser.email;
    } else if (thread.description) {
      return thread.description;
    }
    return '';
  };

  const getDisplayMessage = (thread: any): string => {
    if (thread.lastMessage) {
      return thread.lastMessage.content;
    }
    return 'No messages yet';
  };

  const getAvatarSource = (thread: any): { uri: string } | number => {
    if (activeTab === 'direct' && thread.otherUser?.profile_image_url) {
      return { uri: thread.otherUser.profile_image_url };
    } else if (activeTab === 'notifications' && thread.event?.cover_image_url) {
      return { uri: thread.event.cover_image_url };
    }
    // Default avatar
    return { uri: 'https://via.placeholder.com/50x50' };
  };

  const handleThreadPress = (thread: any) => {
    // Navigate to chat thread screen
    setCurrentScreen(`chat-thread-${thread.id}`);
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };


  const handleStartGroupChat = () => {
    setSelectedChatType('group');
    setShowNewChatModal(false);
    loadAvailableUsers();
    setShowUserSelectionModal(true);
  };

  const handleCreateDirectMessage = () => {
    setSelectedChatType('direct');
    setShowNewChatModal(false);
    loadAvailableUsers();
    setShowUserSelectionModal(true);
  };

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all users except the current user
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id,name,email,avatar_url&id=neq.${user?.id}`, {
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
      });
      
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      } else {
        console.error('Failed to load users:', response.statusText);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelection = (userId: string) => {
    if (selectedChatType === 'direct') {
      // For direct messages, only allow one selection
      setSelectedUsers([userId]);
    } else {
      // For group chats, allow multiple selections
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleStartChat = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Users Selected', 'Please select at least one user to start a chat.');
      return;
    }

    if (selectedChatType === 'direct' && selectedUsers.length > 1) {
      Alert.alert('Invalid Selection', 'Direct messages can only be created with one other user.');
      return;
    }

    if (selectedChatType === 'group' && selectedUsers.length < 2) {
      Alert.alert('Invalid Selection', 'Group chats require at least 2 other users.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start a chat.');
      return;
    }

    if (selectedChatType === 'group') {
      // For group chats, go to name chat step within the same modal
      setUserSelectionStep('name');
      return;
    }

    // For direct messages, create immediately
    setCreatingThread(true);
    
    try {
      const newThread = await ChatService.createDirectMessageThread(user.id, selectedUsers[0]);
      console.log('Created new thread:', newThread);

      // Reset state
      setShowUserSelectionModal(false);
      setSelectedChatType(null);
      setSelectedUsers([]);
      setAvailableUsers([]);

      // Navigate to the new chat thread
      setCurrentScreen(`chat-thread-${newThread.id}`);
      
      // Refresh the threads list to show the new thread
      loadThreads();

    } catch (error) {
      console.error('Error creating chat thread:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    } finally {
      setCreatingThread(false);
    }
  };

  const handleCancelUserSelection = () => {
    setShowUserSelectionModal(false);
    setUserSelectionStep('select');
    setSelectedChatType(null);
    setSelectedUsers([]);
    setAvailableUsers([]);
    setChatName('');
  };

  const handleCreateGroupChat = async () => {
    if (!chatName.trim()) {
      Alert.alert('Chat Name Required', 'Please enter a name for your group chat.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start a chat.');
      return;
    }

    setCreatingThread(true);
    
    try {
      // Create group chat thread with custom name
      const newThread = await ChatService.createGroupChatThread(user.id, selectedUsers, chatName.trim());
      console.log('Created new thread:', newThread);

      // Reset state
      setShowUserSelectionModal(false);
      setUserSelectionStep('select');
      setSelectedChatType(null);
      setSelectedUsers([]);
      setAvailableUsers([]);
      setChatName('');

      // Navigate to the new chat thread
      setCurrentScreen(`chat-thread-${newThread.id}`);
      
      // Refresh the threads list to show the new thread
      loadThreads();

    } catch (error) {
      console.error('Error creating group chat:', error);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    } finally {
      setCreatingThread(false);
    }
  };

  const handleCancelNameChat = () => {
    setUserSelectionStep('select');
    setChatName('');
    setCreatingThread(false);
  };

  const renderThread = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleThreadPress(item)}
    >
      <View style={styles.chatMainContent}>
        <Text style={styles.chatName} numberOfLines={1} ellipsizeMode="tail">{getDisplayName(item)}</Text>
        <Text style={styles.chatTitle} numberOfLines={1} ellipsizeMode="tail">{getDisplaySubtitle(item)}</Text>
        <Text style={styles.chatMessage} numberOfLines={2} ellipsizeMode="tail">{getDisplayMessage(item)}</Text>
      </View>
      <View style={styles.chatRightContent}>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
        <Text style={styles.chatTime}>{formatTimeAgo(item.lastMessageAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'notifications' && 'No notifications yet'}
        {activeTab === 'group' && 'No group chats yet'}
        {activeTab === 'direct' && 'No direct messages yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'notifications' && 'Event notifications will appear here'}
        {activeTab === 'group' && 'Join group chats to start conversations'}
        {activeTab === 'direct' && 'Start a conversation with another user'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {/* Chat Tabs */}
        <View style={styles.chatTabs}>
          <TouchableOpacity
            style={[styles.chatTab, activeTab === 'announcements' && styles.activeChatTab]}
            onPress={() => setActiveTab('announcements')}
          >
            <Text style={[styles.chatTabText, activeTab === 'announcements' && styles.activeChatTabText]}>
              Announcements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chatTab, activeTab === 'group' && styles.activeChatTab]}
            onPress={() => setActiveTab('group')}
          >
            <Text style={[styles.chatTabText, activeTab === 'group' && styles.activeChatTabText]}>
              Group Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chatTab, activeTab === 'direct' && styles.activeChatTab]}
            onPress={() => setActiveTab('direct')}
          >
            <Text style={[styles.chatTabText, activeTab === 'direct' && styles.activeChatTabText]}>
              Direct
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Chat Filters */}
        {activeTab === 'group' && (
          <View style={styles.groupFilters}>
            <TouchableOpacity
              style={[styles.filterButton, groupFilter === 'events' && styles.activeFilterButton]}
              onPress={() => setGroupFilter('events')}
            >
              <Text style={[styles.filterButtonText, groupFilter === 'events' && styles.activeFilterButtonText]}>
                Events
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, groupFilter === 'users' && styles.activeFilterButton]}
              onPress={() => setGroupFilter('users')}
            >
              <Text style={[styles.filterButtonText, groupFilter === 'users' && styles.activeFilterButtonText]}>
                Groups
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {/* Chat Tabs */}
        <View style={styles.chatTabs}>
          <TouchableOpacity
            style={[styles.chatTab, activeTab === 'announcements' && styles.activeChatTab]}
            onPress={() => setActiveTab('announcements')}
          >
            <Text style={[styles.chatTabText, activeTab === 'announcements' && styles.activeChatTabText]}>
              Announcements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chatTab, activeTab === 'group' && styles.activeChatTab]}
            onPress={() => setActiveTab('group')}
          >
            <Text style={[styles.chatTabText, activeTab === 'group' && styles.activeChatTabText]}>
              Group Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chatTab, activeTab === 'direct' && styles.activeChatTab]}
            onPress={() => setActiveTab('direct')}
          >
            <Text style={[styles.chatTabText, activeTab === 'direct' && styles.activeChatTabText]}>
              Direct
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Chat Filters */}
        {activeTab === 'group' && (
          <View style={styles.groupFilters}>
            <TouchableOpacity
              style={[styles.filterButton, groupFilter === 'events' && styles.activeFilterButton]}
              onPress={() => setGroupFilter('events')}
            >
              <Text style={[styles.filterButtonText, groupFilter === 'events' && styles.activeFilterButtonText]}>
                Events
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, groupFilter === 'users' && styles.activeFilterButton]}
              onPress={() => setGroupFilter('users')}
            >
              <Text style={[styles.filterButtonText, groupFilter === 'users' && styles.activeFilterButtonText]}>
                Groups
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadThreads}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Text style={styles.newMessageButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Tabs */}
      <View style={styles.chatTabs}>
        <TouchableOpacity
          style={[styles.chatTab, activeTab === 'notifications' && styles.activeChatTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.chatTabText, activeTab === 'notifications' && styles.activeChatTabText]}>
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chatTab, activeTab === 'group' && styles.activeChatTab]}
          onPress={() => setActiveTab('group')}
        >
          <Text style={[styles.chatTabText, activeTab === 'group' && styles.activeChatTabText]}>
            Group Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chatTab, activeTab === 'direct' && styles.activeChatTab]}
          onPress={() => setActiveTab('direct')}
        >
          <Text style={[styles.chatTabText, activeTab === 'direct' && styles.activeChatTabText]}>
            Direct
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group Chat Filters */}
      {activeTab === 'group' && (
        <View style={styles.groupFilters}>
          <TouchableOpacity
            style={[styles.filterButton, groupFilter === 'events' && styles.activeFilterButton]}
            onPress={() => setGroupFilter('events')}
          >
            <Text style={[styles.filterButtonText, groupFilter === 'events' && styles.activeFilterButtonText]}>
              Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, groupFilter === 'users' && styles.activeFilterButton]}
            onPress={() => setGroupFilter('users')}
          >
            <Text style={[styles.filterButtonText, groupFilter === 'users' && styles.activeFilterButtonText]}>
              Groups
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={handleNewChat}
      >
        <Text style={styles.floatingActionButtonText}>+</Text>
      </TouchableOpacity>

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newChatModal}>
            <Text style={styles.newChatModalTitle}>Start New Chat</Text>
            <Text style={styles.newChatModalSubtitle}>Choose the type of conversation you'd like to start</Text>
            
            <TouchableOpacity
              style={styles.newChatOption}
              onPress={handleStartGroupChat}
            >
              <Text style={styles.newChatOptionIcon}>👥</Text>
              <View style={styles.newChatOptionContent}>
                <Text style={styles.newChatOptionTitle}>Group Chat</Text>
                <Text style={styles.newChatOptionDescription}>Create a group conversation with multiple people</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newChatOption}
              onPress={handleCreateDirectMessage}
            >
              <Text style={styles.newChatOptionIcon}>💬</Text>
              <View style={styles.newChatOptionContent}>
                <Text style={styles.newChatOptionTitle}>Direct Message</Text>
                <Text style={styles.newChatOptionDescription}>Start a private conversation with someone</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newChatCancelButton}
              onPress={() => setShowNewChatModal(false)}
            >
              <Text style={styles.newChatCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Selection Modal */}
      <Modal
        visible={showUserSelectionModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCancelUserSelection}
      >
        <SafeAreaView style={styles.userSelectionModal}>
          {userSelectionStep === 'select' ? (
            <>
              <View style={styles.userSelectionHeader}>
                <Text style={styles.userSelectionTitle}>
                  {selectedChatType === 'group' ? 'Select Users for Group Chat' : 'Select User for Direct Message'}
                </Text>
                <TouchableOpacity onPress={handleCancelUserSelection}>
                  <Text style={styles.userSelectionCancelButton}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : (
                <FlatList
                  data={availableUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.userItem,
                        selectedUsers.includes(item.id) && styles.selectedUserItem
                      ]}
                      onPress={() => handleUserSelection(item.id)}
                    >
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>
                      {selectedUsers.includes(item.id) && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.usersList}
                />
              )}

              <View style={styles.userSelectionFooter}>
                <TouchableOpacity
                  style={[
                    styles.startChatButton,
                    (selectedUsers.length === 0 || creatingThread) && styles.startChatButtonDisabled
                  ]}
                  onPress={handleStartChat}
                  disabled={selectedUsers.length === 0 || creatingThread}
                >
                  <Text style={[
                    styles.startChatButtonText,
                    (selectedUsers.length === 0 || creatingThread) && styles.startChatButtonTextDisabled
                  ]}>
                    {creatingThread 
                      ? 'Creating...' 
                      : selectedChatType === 'group' 
                        ? 'Next' 
                        : 'Start Message'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.userSelectionHeader}>
                <Text style={styles.userSelectionTitle}>Name Chat</Text>
                <TouchableOpacity onPress={handleCancelNameChat}>
                  <Text style={styles.userSelectionCancelButton}>Back</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.nameChatContent}>
                <Text style={styles.nameChatSubtitle}>
                  Give your group chat a name
                </Text>
                
                <TextInput
                  style={styles.nameChatInput}
                  placeholder="Enter chat name..."
                  value={chatName}
                  onChangeText={setChatName}
                  maxLength={50}
                  autoFocus
                />
                
                <Text style={styles.nameChatHint}>
                  {chatName.length}/50 characters
                </Text>
              </View>

              <View style={styles.userSelectionFooter}>
                <TouchableOpacity
                  style={[
                    styles.startChatButton,
                    (!chatName.trim() || creatingThread) && styles.startChatButtonDisabled
                  ]}
                  onPress={handleCreateGroupChat}
                  disabled={!chatName.trim() || creatingThread}
                >
                  <Text style={[
                    styles.startChatButtonText,
                    (!chatName.trim() || creatingThread) && styles.startChatButtonTextDisabled
                  ]}>
                    {creatingThread ? 'Creating...' : 'Start Group Chat'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

// Chat Thread Screen
const ChatThreadScreen: React.FC<{ threadId: string; setCurrentScreen: (screen: string) => void }> = ({ 
  threadId, 
  setCurrentScreen 
}) => {
  const { user } = useAuth();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Members Modal State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [threadMembers, setThreadMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Add Members Modal State
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableUsersForAdd, setAvailableUsersForAdd] = useState<any[]>([]);
  const [selectedUsersForAdd, setSelectedUsersForAdd] = useState<string[]>([]);
  const [loadingUsersForAdd, setLoadingUsersForAdd] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  useEffect(() => {
    if (user) {
      loadThreadData();
      loadMessages();
      startRealTimeUpdates();
    }

    return () => {
      // Clean up real-time listeners
      RealTimeService.stopListeningToThread(threadId);
    };
  }, [threadId, user]);

  // Load members when members modal is opened
  useEffect(() => {
    if (showMembersModal && thread?.type === 'group') {
      loadThreadMembers();
    }
  }, [showMembersModal, thread]);

  const loadThreadData = async () => {
    try {
      const threads = await ChatService.getUserThreads(user!.id);
      const currentThread = threads.find(t => t.id === threadId);
      setThread(currentThread || null);
    } catch (err) {
      console.error('Error loading thread data:', err);
      setError('Failed to load chat thread');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await ChatService.getThreadMessages(threadId);
      setMessages(messagesData);
      
      // Mark messages as read
      if (user) {
        await ChatService.markMessagesAsRead(threadId, user.id);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    if (!user) return;

    // Start listening for new messages
    RealTimeService.startListeningToThread(threadId, user.id);

    // Subscribe to new messages
    const unsubscribeMessages = RealTimeService.subscribeToMessages(threadId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Mark as read if user is viewing the thread
      ChatService.markMessagesAsRead(threadId, user.id);
    });

    // Subscribe to thread updates
    const unsubscribeThread = RealTimeService.subscribeToThreadUpdates(threadId, (update) => {
      setThread(prev => prev ? { ...prev, unreadCount: update.unreadCount } : null);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeThread();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      const message = await ChatService.sendMessage(threadId, user.id, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getThreadTitle = (): string => {
    if (!thread) return 'Chat';
    
    if (thread.type === 'dm' && thread.otherUser) {
      return thread.otherUser.name;
    } else if (thread.type === 'event' && thread.event) {
      return thread.event.title;
    } else if (thread.name) {
      return thread.name;
    }
    
    return 'Chat';
  };

  const loadThreadMembers = async () => {
    if (!thread || thread.type !== 'group') return;
    
    setLoadingMembers(true);
    try {
      // Get members from chat_memberships table
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/chat_memberships?select=*,users(*)&thread_id=eq.${threadId}&is_active=eq.true`,
        {
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const members = await response.json();
        setThreadMembers(members);
      }
    } catch (err) {
      console.error('Error loading thread members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadAvailableUsersForAdd = async () => {
    setLoadingUsersForAdd(true);
    try {
      // Get all users except current members
      const currentMemberIds = threadMembers.map(member => member.user_id);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id,name,email&id=not.in.(${currentMemberIds.join(',')})`,
        {
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const users = await response.json();
        setAvailableUsersForAdd(users);
      }
    } catch (err) {
      console.error('Error loading available users:', err);
    } finally {
      setLoadingUsersForAdd(false);
    }
  };

  const handleAddMembers = () => {
    setShowMembersModal(false);
    setShowAddMembersModal(true);
    loadAvailableUsersForAdd();
  };

  const handleUserSelectionForAdd = (userId: string) => {
    setSelectedUsersForAdd(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddSelectedMembers = async () => {
    if (selectedUsersForAdd.length === 0) {
      Alert.alert('No Users Selected', 'Please select at least one user to add.');
      return;
    }

    setAddingMembers(true);
    try {
      // Add each selected user to the thread
      for (const userId of selectedUsersForAdd) {
        await ChatService.joinThread(threadId, userId);
      }

      // Refresh members list
      await loadThreadMembers();
      
      // Reset state and close modals
      setShowAddMembersModal(false);
      setSelectedUsersForAdd([]);
      setAvailableUsersForAdd([]);
      setShowMembersModal(true);

      Alert.alert('Success', `Added ${selectedUsersForAdd.length} member(s) to the group.`);
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleCancelAddMembers = () => {
    setShowAddMembersModal(false);
    setSelectedUsersForAdd([]);
    setAvailableUsersForAdd([]);
    setShowMembersModal(true);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.userId === user?.id;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <Image 
            source={{ uri: item.user?.profile_image_url || 'https://via.placeholder.com/30x30' }} 
            style={styles.messageAvatar} 
          />
        )}
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {!isOwnMessage && (
            <Text style={styles.messageSender}>{item.user?.name}</Text>
          )}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('chat')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>Loading...</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('chat')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>Error</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('chat')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>{getThreadTitle()}</Text>
        {thread?.type === 'group' ? (
          <TouchableOpacity onPress={() => setShowMembersModal(true)}>
            <Text style={styles.membersButton}>Members</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <View style={styles.chatContentContainer}>
        {/* Messages List */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Message Input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 108 : 0}
          style={styles.keyboardAvoidingInput}
        >
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? '...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <SafeAreaView style={styles.userSelectionModal}>
          <View style={styles.userSelectionHeader}>
            <Text style={styles.userSelectionTitle}>Members</Text>
            <TouchableOpacity onPress={() => setShowMembersModal(false)}>
              <Text style={styles.userSelectionCancelButton}>Done</Text>
            </TouchableOpacity>
          </View>

          {loadingMembers ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : (
            <FlatList
              data={threadMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.userItem}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.users?.name ? item.users.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.users?.name || 'Unknown User'}</Text>
                    <Text style={styles.userEmail}>{item.users?.email}</Text>
                  </View>
                  <View style={styles.memberRole}>
                    <Text style={styles.memberRoleText}>{item.role}</Text>
                  </View>
                </View>
              )}
              style={styles.usersList}
              ListFooterComponent={() => (
                <TouchableOpacity
                  style={styles.addMemberButton}
                  onPress={handleAddMembers}
                >
                  <Text style={styles.addMemberButtonText}>+ Add Members</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        visible={showAddMembersModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCancelAddMembers}
      >
        <SafeAreaView style={styles.userSelectionModal}>
          <View style={styles.userSelectionHeader}>
            <Text style={styles.userSelectionTitle}>Add Members</Text>
            <TouchableOpacity onPress={handleCancelAddMembers}>
              <Text style={styles.userSelectionCancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {loadingUsersForAdd ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <FlatList
              data={availableUsersForAdd}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userItem,
                    selectedUsersForAdd.includes(item.id) && styles.selectedUserItem
                  ]}
                  onPress={() => handleUserSelectionForAdd(item.id)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  {selectedUsersForAdd.includes(item.id) && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              style={styles.usersList}
            />
          )}

          <View style={styles.userSelectionFooter}>
            <TouchableOpacity
              style={[
                styles.startChatButton,
                (selectedUsersForAdd.length === 0 || addingMembers) && styles.startChatButtonDisabled
              ]}
              onPress={handleAddSelectedMembers}
              disabled={selectedUsersForAdd.length === 0 || addingMembers}
            >
              <Text style={[
                styles.startChatButtonText,
                (selectedUsersForAdd.length === 0 || addingMembers) && styles.startChatButtonTextDisabled
              ]}>
                {addingMembers 
                  ? 'Adding...' 
                  : `Add ${selectedUsersForAdd.length} Member${selectedUsersForAdd.length !== 1 ? 's' : ''}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Main App with Navigation
const MainApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('events');

  const renderScreen = () => {
    if (currentScreen.startsWith('chat-thread-')) {
      // Handle chat thread screens
      const threadId = currentScreen.replace('chat-thread-', '');
      return <ChatThreadScreen threadId={threadId} setCurrentScreen={setCurrentScreen} />;
    }
    
    switch (currentScreen) {
      case 'events':
        return <EventsScreen setCurrentScreen={setCurrentScreen} />;
      case 'profile':
        return <ProfileScreen />;
      case 'chat':
        return <ChatScreen setCurrentScreen={setCurrentScreen} />;
      default:
        return <EventsScreen setCurrentScreen={setCurrentScreen} />;
    }
  };

  const isInChatThread = currentScreen.startsWith('chat-thread-');

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
      
      {/* Bottom Navigation - Hide when in chat thread */}
      {!isInChatThread && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'events' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('events')}
          >
            <Text style={styles.navIcon}>📅</Text>
            <Text style={[styles.navLabel, currentScreen === 'events' && styles.activeNavLabel]}>Events</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'chat' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('chat')}
          >
            <Text style={styles.navIcon}>💬</Text>
            <Text style={[styles.navLabel, currentScreen === 'chat' && styles.activeNavLabel]}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'profile' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('profile')}
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={[styles.navLabel, currentScreen === 'profile' && styles.activeNavLabel]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#265451',
  },
  dataSourceIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dataSourceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#D29507',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  myEventsButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  myEventsButtonActive: {
    backgroundColor: '#3B82F6',
  },
  myEventsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  myEventsButtonTextActive: {
    color: 'white',
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 35, // 35px from the bottom
    right: 20,
    backgroundColor: '#D29507', // Match active tab color
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingActionButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#265451',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  newMessageButton: {
    backgroundColor: '#D29507',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newMessageButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Events Styles
  eventsList: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#265451',
    flex: 1,
    marginRight: 10,
  },
  eventTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  eventTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  eventBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rsvpBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  eventDetails: {
    marginBottom: 15,
  },
  eventDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rsvpButton: {
    backgroundColor: '#D29507',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rsvpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Profile Styles
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#265451',
    marginBottom: 5,
  },
  profileTitle: {
    fontSize: 16,
    color: '#D29507',
    marginBottom: 5,
  },
  profileCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#265451',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 14,
    color: '#265451',
    flex: 1,
    textAlign: 'right',
  },
  profileActions: {
    marginTop: 20,
    gap: 12,
  },
  profileActionButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileActionButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#933B25',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rsvpSummary: {
    gap: 12,
  },
  rsvpItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  rsvpItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rsvpEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  rsvpStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rsvpStatusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rsvpEventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  rsvpEventLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Chat Styles
  chatTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 10,
    justifyContent: 'center',
  },
  chatTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  activeChatTab: {
    backgroundColor: '#D29507',
  },
  chatTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeChatTabText: {
    color: 'white',
  },
  chatsList: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'flex-start',
  },
  chatMainContent: {
    flex: 1,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  chatRightContent: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#265451',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  chatTitle: {
    fontSize: 13,
    color: '#D29507',
    fontWeight: '500',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  chatMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    alignSelf: 'flex-start',
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#D29507',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Group Chat Filters
  groupFilters: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  activeFilterButton: {
    backgroundColor: '#D29507',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#D29507',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Chat Thread Screen Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#D29507',
    fontWeight: '600',
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#265451',
    flex: 1,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatContentContainer: {
    flex: 1,
  },
  keyboardAvoidingInput: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 80, // Space for input area
  },
  messagesContainer: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#D29507',
  },
  messageSender: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    minHeight: 60,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#D29507',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // New Chat Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  newChatModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#265451',
    textAlign: 'center',
    marginBottom: 8,
  },
  newChatModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
  },
  newChatOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  newChatOptionContent: {
    flex: 1,
  },
  newChatOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#265451',
    marginBottom: 4,
  },
  newChatOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  newChatCancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  newChatCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#FBF6F1',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#D29507',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  activitiesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tapToViewText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  arrowText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  // User Selection Modal Styles
  userSelectionModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  userSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  userSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#265451',
    flex: 1,
  },
  userSelectionCancelButton: {
    color: '#D29507',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 6,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedUserItem: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#D29507',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D29507',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#265451',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D29507',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSelectionFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  startChatButton: {
    backgroundColor: '#D29507',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startChatButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  startChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  startChatButtonTextDisabled: {
    color: '#9CA3AF',
  },
  nameChatContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  nameChatSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  nameChatInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  nameChatHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  membersButton: {
    fontSize: 16,
    color: '#D29507',
    fontWeight: '600',
  },
  memberRole: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  memberRoleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  addMemberButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#D29507',
    borderRadius: 12,
    alignItems: 'center',
  },
  addMemberButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainApp;
