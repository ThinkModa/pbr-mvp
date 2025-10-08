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
} from 'react-native';
import { useAuth } from '../contexts/MockAuthContext';
import { EventsService, EventWithActivities } from '../services/eventsService';
import { RSVPService, RSVPStatus } from '../services/rsvpService';
import { SpeakersService, EventSpeaker } from '../services/speakersService';
import { BusinessesService, EventBusiness } from '../services/businessesService';
import { OrganizationsService, EventOrganization } from '../services/organizationsService';
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
    
    // Close the modal
    setModalVisible(false);
    setSelectedEvent(null);
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
            {item.activities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Text style={styles.activityName}>• {activity.title}</Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.start_time + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                </Text>
              </View>
            ))}
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
                {/* Event Image Placeholder */}
                <View style={{ height: 200, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, color: '#9CA3AF' }}>📅</Text>
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
                      {selectedEvent.activities.map((activity) => (
                        <TouchableOpacity
                          key={activity.id}
                          style={{ 
                            backgroundColor: 'white', 
                            padding: 15, 
                            borderRadius: 12, 
                            marginBottom: 10,
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
                          🛍️ Vendors ({totalVendors})
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
                  <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, margin: 20, marginBottom: 0 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                      📅 {selectedEvent.title}
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
                          🛍️ Vendors ({totalVendors})
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
                  backgroundColor: '#D29507', 
                  paddingVertical: 15, 
                  borderRadius: 8, 
                  alignItems: 'center'
                }}
                onPress={() => handleEventRSVP(selectedEvent.id, 'attending')}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  RSVP for Event
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
const ChatScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [message, setMessage] = useState('');

  const chats = [
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Property Buyer',
      lastMessage: 'Thanks for showing me the property yesterday!',
      time: '2 min ago',
      unread: 2,
      avatar: 'https://via.placeholder.com/50x50',
    },
    {
      id: '2',
      name: 'Mike Chen',
      title: 'Investment Partner',
      lastMessage: 'Let\'s discuss the downtown property deal',
      time: '1 hour ago',
      unread: 0,
      avatar: 'https://via.placeholder.com/50x50',
    },
    {
      id: '3',
      name: 'Lisa Rodriguez',
      title: 'Property Seller',
      lastMessage: 'The inspection went well, when can we close?',
      time: '3 hours ago',
      unread: 1,
      avatar: 'https://via.placeholder.com/50x50',
    },
  ];

  const renderChat = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.chatItem}>
      <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <Text style={styles.chatTitle}>{item.title}</Text>
        <Text style={styles.chatMessage}>{item.lastMessage}</Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
          style={[styles.chatTab, activeTab === 'all' && styles.activeChatTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.chatTabText, activeTab === 'all' && styles.activeChatTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chatTab, activeTab === 'buyers' && styles.activeChatTab]}
          onPress={() => setActiveTab('buyers')}
        >
          <Text style={[styles.chatTabText, activeTab === 'buyers' && styles.activeChatTabText]}>Buyers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chatTab, activeTab === 'sellers' && styles.activeChatTab]}
          onPress={() => setActiveTab('sellers')}
        >
          <Text style={[styles.chatTabText, activeTab === 'sellers' && styles.activeChatTabText]}>Sellers</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Main App with Navigation
const MainApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('events');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'events':
        return <EventsScreen setCurrentScreen={setCurrentScreen} />;
      case 'profile':
        return <ProfileScreen />;
      case 'chat':
        return <ChatScreen />;
      default:
        return <EventsScreen setCurrentScreen={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
      
      {/* Bottom Navigation */}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 20,
    borderRadius: 20,
  },
  activeChatTab: {
    backgroundColor: '#D29507',
  },
  chatTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeChatTabText: {
    color: 'white',
  },
  chatsList: {
    padding: 20,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#265451',
  },
  chatTime: {
    fontSize: 12,
    color: '#666',
  },
  chatTitle: {
    fontSize: 12,
    color: '#D29507',
    marginBottom: 5,
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#D29507',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
});

export default MainApp;
