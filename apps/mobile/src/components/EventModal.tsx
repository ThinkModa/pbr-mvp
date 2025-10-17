import React, { useState, useEffect } from 'react';
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
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
// import { showLocation } from 'react-native-map-link'; // Removed - using native Linking instead
import { EventWithActivities } from '../services/eventsService';
import { RSVPService, RSVPStatus } from '../services/rsvpService';
// import { CalendarService, CalendarEvent } from '../services/calendarService'; // Temporarily disabled - requires native compilation
import { SpeakersService, EventSpeaker } from '../services/speakersService';
import { BusinessesService, EventBusiness } from '../services/businessesService';
import { OrganizationsService, EventOrganization } from '../services/organizationsService';
import { useAuth } from '../contexts/MockAuthContext';
import SpeakerModal from './SpeakerModal';
import BusinessModal from './BusinessModal';
import OrganizationModal from './OrganizationModal';

interface EventModalProps {
  visible: boolean;
  event: EventWithActivities | null;
  onClose: () => void;
  onRSVP: (eventId: string, status: 'attending' | 'not_attending' | null) => void;
  onActivityPress: (activity: any) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EventModal: React.FC<EventModalProps> = ({ visible, event, onClose, onRSVP, onActivityPress }) => {
  const { user } = useAuth();
  const [userRSVP, setUserRSVP] = useState<RSVPStatus | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [eventInCalendar, setEventInCalendar] = useState(false);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [businesses, setBusinesses] = useState<EventBusiness[]>([]);
  const [organizations, setOrganizations] = useState<EventOrganization[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [selectedBusinessContacts, setSelectedBusinessContacts] = useState<any[]>([]);
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  console.log('🎬 EventModal render:', { visible, event: event?.title });
  console.log('🎬 EventModal: About to render map placeholder section');

  // Debug: Log event data when modal opens
  useEffect(() => {
    if (visible && event) {
      console.log('🎬 EventModal opened with event:', {
        eventId: event.id,
        eventTitle: event.title,
        location: event.location,
        location_address: event.location_address,
        latitude: event.latitude,
        longitude: event.longitude,
        hasLocationObject: !!event.location,
        hasCoordinatesInLocation: !!(event.location?.coordinates),
        hasLatitudeField: event.latitude !== null && event.latitude !== undefined,
        hasLongitudeField: event.longitude !== null && event.longitude !== undefined
      });
    }
  }, [visible, event]);

  // Open in Maps function
  const openInMaps = async (latitude: number, longitude: number, title?: string, address?: string) => {
    try {
      await showLocation({
        latitude,
        longitude,
        title: title || 'Event Location',
        dialogTitle: 'Open in Maps',
        dialogMessage: 'Choose your preferred maps app',
        cancelText: 'Cancel',
        alwaysIncludeGoogle: true,
      });
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  // Load user's RSVP status, calendar status, speakers, and businesses when modal opens
  useEffect(() => {
    if (visible && event && user) {
      loadUserRSVP();
      checkEventInCalendar();
      loadEventSpeakers();
      loadEventBusinesses();
      loadEventOrganizations();
    }
  }, [visible, event, user]);

  const loadUserRSVP = async () => {
    if (!event || !user) return;
    
    try {
      const rsvp = await RSVPService.getUserEventRSVP(event.id, user.id);
      setUserRSVP(rsvp?.status || null);
    } catch (error) {
      console.error('Error loading user RSVP:', error);
    }
  };

  const checkEventInCalendar = async () => {
    if (!event) return;
    
    try {
      const calendarEvent: CalendarEvent = {
        title: event.title,
        startDate: new Date(event.start_time),
        endDate: new Date(event.end_time),
        location: event.location?.name || undefined,
        notes: event.description || undefined,
      };
      
      const exists = await CalendarService.eventExistsInCalendar(calendarEvent);
      setEventInCalendar(exists);
    } catch (error) {
      console.error('Error checking event in calendar:', error);
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) return;
    
    setCalendarLoading(true);
    try {
      const calendarEvent: CalendarEvent = {
        title: event.title,
        startDate: new Date(event.start_time),
        endDate: new Date(event.end_time),
        location: event.location?.name || undefined,
        notes: event.description || undefined,
      };
      
      const success = await CalendarService.addEventToCalendar(calendarEvent);
      if (success) {
        setEventInCalendar(true);
        Alert.alert(
          'Event Added',
          `${event.title} has been added to your calendar.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error adding event to calendar:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleRemoveFromCalendar = async () => {
    if (!event) return;
    
    setCalendarLoading(true);
    try {
      const calendarEvent: CalendarEvent = {
        title: event.title,
        startDate: new Date(event.start_time),
        endDate: new Date(event.end_time),
        location: event.location?.name || undefined,
        notes: event.description || undefined,
      };
      
      const success = await CalendarService.removeEventFromCalendar(calendarEvent);
      if (success) {
        setEventInCalendar(false);
        Alert.alert(
          'Event Removed',
          `${event.title} has been removed from your calendar.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error removing event from calendar:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleRSVP = async (status: RSVPStatus) => {
    if (!event || !user) return;
    
    setRsvpLoading(true);
    try {
      // Always use createEventRSVP which handles upsert logic
      await RSVPService.createEventRSVP(event.id, user.id, status);
      
      setUserRSVP(status);
      // Convert 'maybe', 'waitlist', 'pending' to null for onRSVP callback
      const rsvpStatus = (status === 'maybe' || status === 'waitlist' || status === 'pending') ? null : status;
      onRSVP(event.id, rsvpStatus);
      
      // Show confirmation
      Alert.alert(
        'RSVP Confirmed!',
        `You're going to ${event.title}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleRemoveRSVP = async () => {
    if (!event || !user) return;
    
    // Show confirmation modal first
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
          onPress: async () => {
            setRsvpLoading(true);
            try {
              // Get the existing RSVP to delete it
              const existingRSVP = await RSVPService.getUserEventRSVP(event.id, user.id);
              if (existingRSVP) {
                await RSVPService.deleteEventRSVP(existingRSVP.id);
              }
              
              setUserRSVP(null);
              onRSVP(event.id, null); // Notify parent to remove from userRSVPs
              
              // Show success confirmation
              Alert.alert(
                'RSVP Removed',
                `You're no longer going to ${event.title}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error removing RSVP:', error);
              Alert.alert('Error', 'Failed to remove RSVP. Please try again.');
            } finally {
              setRsvpLoading(false);
            }
          },
        },
      ]
    );
  };

  const loadEventSpeakers = async () => {
    if (!event) return;
    
    try {
      const eventSpeakers = await SpeakersService.getEventSpeakers(event.id);
      setSpeakers(eventSpeakers);
    } catch (error) {
      console.error('Error loading event speakers:', error);
    }
  };

  const loadEventBusinesses = async () => {
    if (!event) return;
    
    try {
      const eventBusinesses = await BusinessesService.getEventBusinesses(event.id);
      setBusinesses(eventBusinesses);
    } catch (error) {
      console.error('Error loading event businesses:', error);
    }
  };

  const loadEventOrganizations = async () => {
    if (!event) return;
    
    try {
      const eventOrganizations = await OrganizationsService.getEventOrganizations(event.id);
      setOrganizations(eventOrganizations);
    } catch (error) {
      console.error('Error loading event organizations:', error);
    }
  };

  const handleSpeakerPress = (speaker: EventSpeaker) => {
    setSelectedSpeaker(speaker.speaker);
    setSpeakerModalVisible(true);
  };

  const handleBusinessPress = (business: EventBusiness) => {
    setSelectedBusiness(business.business);
    setSelectedBusinessContacts(business.contacts || []);
    setBusinessModalVisible(true);
  };

  const handleOrganizationPress = (organization: EventOrganization) => {
    setSelectedOrganization(organization.organization);
    setOrganizationModalVisible(true);
  };

  const onRefresh = async () => {
    console.log('🔄 Pull-to-refresh triggered');
    if (!event) {
      console.log('❌ No event found, skipping refresh');
      return;
    }
    
    setRefreshing(true);
    console.log('🔄 Starting refresh...');
    try {
      // Reload all data for the event
      await Promise.all([
        loadUserRSVP(),
        loadEventSpeakers(),
        loadEventBusinesses(),
        loadEventOrganizations(),
        checkEventInCalendar()
      ]);
      console.log('✅ Refresh completed successfully');
    } catch (error) {
      console.error('❌ Error refreshing event data:', error);
    } finally {
      setRefreshing(false);
      console.log('🔄 Refresh finished');
    }
  };


  if (!event) return null;

  const startDate = new Date(event.start_time + 'Z');
  const endDate = new Date(event.end_time + 'Z');
  
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

  const handleActivityPress = (activity: any) => {
    console.log('🎯 Activity clicked in EventModal:', activity);
    console.log('🎯 Activity title:', activity?.title);
    console.log('🎯 onActivityPress prop exists:', !!onActivityPress);
    console.log('🎯 Calling onActivityPress...');
    if (onActivityPress) {
      onActivityPress(activity);
      console.log('🎯 onActivityPress called successfully');
    } else {
      console.log('🎯 ERROR: onActivityPress prop is missing!');
    }
  };


  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        presentationStyle="pageSheet"
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            alwaysBounceVertical={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4F46E5"
                colors={["#4F46E5"]}
                progressBackgroundColor="#ffffff"
              />
            }
          >
            {/* Event Image */}
            <View style={styles.imageContainer}>
              {event.cover_image_url ? (
                <Image
                  source={{ uri: event.cover_image_url }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>📅</Text>
                </View>
              )}
            </View>

            {/* Event Details */}
            <View style={styles.detailsContainer}>
              {/* Title and Location */}
              <View style={styles.titleSection}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationText}>
                      {event.location?.name || 'Location TBD'}
                    </Text>
                    {(event.location?.address || event.location_address) && (
                      <Text style={styles.locationAddress}>
                        {event.location?.address || event.location_address}
                      </Text>
                    )}
                  </View>
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

              {/* Event Info */}
              <View style={styles.infoSection}>
                {(event.show_attendee_count !== false || event.show_capacity !== false) && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Capacity</Text>
                    <Text style={styles.infoValue}>
                      {event.show_attendee_count !== false ? (event.current_rsvps || 0) : ''}
                      {event.show_attendee_count !== false && event.show_capacity !== false && ' / '}
                      {event.show_capacity !== false ? (event.max_capacity || '∞') : ''} attendees
                    </Text>
                  </View>
                )}
                {(event.show_price !== false && (event.is_free || event.price)) && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Price</Text>
                    <Text style={styles.infoValue}>
                      {event.is_free ? 'Free' : `$${((event.price || 0) / 100).toFixed(2)}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>About this event</Text>
                <Text style={styles.description}>
                  {event.description || 'No description available.'}
                </Text>
              </View>

              {/* Activities */}
              {event.activities && event.activities.length > 0 && (
                <View style={styles.activitiesSection}>
                  <Text style={styles.sectionTitle}>Activities ({event.activities.length})</Text>
                  {(() => {
                    // Group activities by date
                    const activitiesByDate = event.activities.reduce((groups, activity) => {
                      const date = new Date(activity.start_time + 'Z').toDateString();
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(activity);
                      return groups;
                    }, {} as Record<string, typeof event.activities>);

                    // Sort dates
                    const sortedDates = Object.keys(activitiesByDate).sort((a, b) => 
                      new Date(a).getTime() - new Date(b).getTime()
                    );

                    return sortedDates.map((dateString, dateIndex) => {
                      const activities = activitiesByDate[dateString];
                      const date = new Date(dateString);
                      
                      return (
                        <View key={dateString} style={styles.dateGroup}>
                          {/* Date Header */}
                          <Text style={styles.dateHeader}>
                            {date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                          
                          {/* Activities for this date */}
                          {activities.map((activity, activityIndex) => (
                            <TouchableOpacity
                              key={activity.id}
                              style={[
                                styles.activityCard,
                                activityIndex === activities.length - 1 && styles.lastActivityInGroup
                              ]}
                              onPress={() => {
                                console.log('🎯 Activity TouchableOpacity pressed:', activity.title);
                                handleActivityPress(activity);
                              }}
                            >
                              <View style={styles.activityHeader}>
                                <View style={styles.activityInfo}>
                                  <Text style={styles.activityTitle}>{activity.title}</Text>
                                  <Text style={styles.activityTime}>
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
                                <Text style={styles.activityArrow}>›</Text>
                              </View>
                              <Text style={styles.activityDescription} numberOfLines={2}>
                                {activity.description || 'No description available.'}
                              </Text>
                              {activity.location?.name && (
                                <View style={styles.activityLocation}>
                                  <Text style={styles.activityLocationIcon}>📍</Text>
                                  <Text style={styles.activityLocationText}>{activity.location.name}</Text>
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
              {speakers.length > 0 && (
                <View style={styles.speakersSection}>
                  <Text style={styles.sectionTitle}>Speakers ({speakers.length})</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.speakersScrollView}
                    contentContainerStyle={styles.speakersScrollContent}
                  >
                    {speakers.map((eventSpeaker) => (
                      <TouchableOpacity
                        key={eventSpeaker.id}
                        style={styles.speakerCard}
                        onPress={() => handleSpeakerPress(eventSpeaker)}
                      >
                        <View style={styles.speakerAvatar}>
                          {eventSpeaker.speaker?.profileImageUrl ? (
                            <Image 
                              source={{ uri: eventSpeaker.speaker.profileImageUrl }} 
                              style={styles.speakerAvatarImage} 
                            />
                          ) : (
                            <View style={styles.speakerAvatarPlaceholder}>
                              <Text style={styles.speakerAvatarText}>
                                {eventSpeaker.speaker?.firstName?.[0]}{eventSpeaker.speaker?.lastName?.[0]}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.speakerName} numberOfLines={1}>
                          {eventSpeaker.speaker?.firstName} {eventSpeaker.speaker?.lastName}
                        </Text>
                        <Text style={styles.speakerTitle} numberOfLines={1}>
                          {eventSpeaker.speaker?.title}
                        </Text>
                        <Text style={styles.speakerCompany} numberOfLines={1}>
                          @{eventSpeaker.speaker?.company}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Sponsors Section (Businesses + Organizations with is_sponsor=true) */}
              {(() => {
                const sponsorBusinesses = businesses.filter(b => b.business?.isSponsor === true);
                const sponsorOrganizations = organizations.filter(o => o.organization?.isSponsor === true);
                const totalSponsors = sponsorBusinesses.length + sponsorOrganizations.length;
                
                return totalSponsors > 0 && (
                  <View style={styles.businessesSection}>
                    <Text style={styles.sectionTitle}>Sponsors ({totalSponsors})</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.businessesScrollView}
                      contentContainerStyle={styles.businessesScrollContent}
                    >
                      {/* Render Sponsor Businesses */}
                      {sponsorBusinesses.map((eventBusiness) => (
                        <TouchableOpacity
                          key={`business-${eventBusiness.id}`}
                          style={styles.businessCard}
                          onPress={() => handleBusinessPress(eventBusiness)}
                        >
                          <View style={styles.businessLogo}>
                            {eventBusiness.business?.logoUrl ? (
                              <Image 
                                source={{ uri: eventBusiness.business.logoUrl }} 
                                style={styles.businessLogoImage} 
                              />
                            ) : (
                              <View style={styles.businessLogoPlaceholder}>
                                <Text style={styles.businessLogoText}>
                                  {eventBusiness.business?.name?.substring(0, 2).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.businessName} numberOfLines={2}>
                            {eventBusiness.business?.name}
                          </Text>
                          {eventBusiness.sponsorshipLevel && (
                            <Text style={styles.businessSponsorLevel}>
                              {eventBusiness.sponsorshipLevel} Sponsor
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      
                      {/* Render Sponsor Organizations */}
                      {sponsorOrganizations.map((eventOrganization) => (
                        <TouchableOpacity
                          key={`organization-${eventOrganization.id}`}
                          style={styles.businessCard}
                          onPress={() => handleOrganizationPress(eventOrganization)}
                        >
                          <View style={styles.businessLogo}>
                            {eventOrganization.organization?.logoUrl ? (
                              <Image 
                                source={{ uri: eventOrganization.organization.logoUrl }} 
                                style={styles.businessLogoImage} 
                              />
                            ) : (
                              <View style={styles.businessLogoPlaceholder}>
                                <Text style={styles.businessLogoText}>
                                  {eventOrganization.organization?.name?.substring(0, 2).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.businessName} numberOfLines={2}>
                            {eventOrganization.organization?.name}
                          </Text>
                          {eventOrganization.sponsorshipLevel && (
                            <Text style={styles.businessSponsorLevel}>
                              {eventOrganization.sponsorshipLevel} Sponsor
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}

              {/* Vendors Section (Businesses + Organizations with is_sponsor=false) */}
              {(() => {
                const vendorBusinesses = businesses.filter(b => b.business?.isSponsor === false);
                const vendorOrganizations = organizations.filter(o => o.organization?.isSponsor === false);
                const totalVendors = vendorBusinesses.length + vendorOrganizations.length;
                
                return totalVendors > 0 && (
                  <View style={styles.businessesSection}>
                    <Text style={styles.sectionTitle}>Vendors ({totalVendors})</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.businessesScrollView}
                      contentContainerStyle={styles.businessesScrollContent}
                    >
                      {/* Render Vendor Businesses */}
                      {vendorBusinesses.map((eventBusiness) => (
                        <TouchableOpacity
                          key={`business-${eventBusiness.id}`}
                          style={styles.businessCard}
                          onPress={() => handleBusinessPress(eventBusiness)}
                        >
                          <View style={styles.businessLogo}>
                            {eventBusiness.business?.logoUrl ? (
                              <Image 
                                source={{ uri: eventBusiness.business.logoUrl }} 
                                style={styles.businessLogoImage} 
                              />
                            ) : (
                              <View style={styles.businessLogoPlaceholder}>
                                <Text style={styles.businessLogoText}>
                                  {eventBusiness.business?.name?.substring(0, 2).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.businessName} numberOfLines={2}>
                            {eventBusiness.business?.name}
                          </Text>
                          <Text style={styles.businessSponsorLevel}>
                            Vendor
                          </Text>
                        </TouchableOpacity>
                      ))}
                      
                      {/* Render Vendor Organizations */}
                      {vendorOrganizations.map((eventOrganization) => (
                        <TouchableOpacity
                          key={`organization-${eventOrganization.id}`}
                          style={styles.businessCard}
                          onPress={() => handleOrganizationPress(eventOrganization)}
                        >
                          <View style={styles.businessLogo}>
                            {eventOrganization.organization?.logoUrl ? (
                              <Image 
                                source={{ uri: eventOrganization.organization.logoUrl }} 
                                style={styles.businessLogoImage} 
                              />
                            ) : (
                              <View style={styles.businessLogoPlaceholder}>
                                <Text style={styles.businessLogoText}>
                                  {eventOrganization.organization?.name?.substring(0, 2).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.businessName} numberOfLines={2}>
                            {eventOrganization.organization?.name}
                          </Text>
                          <Text style={styles.businessSponsorLevel}>
                            Vendor
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}


            </View>

            {/* Map Section - Top Level */}
            {(() => {
              // Get coordinates from either the separate fields or the location object
              const lat = event.latitude || event.location?.coordinates?.lat;
              const lng = event.longitude || event.location?.coordinates?.lng;
              
              // Convert to numbers and validate
              const latNum = lat ? Number(lat) : null;
              const lngNum = lng ? Number(lng) : null;
              const hasValidCoordinates = latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum);
              
              console.log('🗺️ EventModal map coordinates:', {
                eventId: event.id,
                eventTitle: event.title,
                latitude: event.latitude,
                longitude: event.longitude,
                locationCoordinates: event.location?.coordinates,
                rawLat: lat,
                rawLng: lng,
                latNum: latNum,
                lngNum: lngNum,
                hasValidCoordinates: hasValidCoordinates,
                locationName: event.location?.name,
                locationAddress: event.location_address,
                willShowMap: hasValidCoordinates,
                willShowPlaceholder: !hasValidCoordinates && !!(event.location?.name),
                willShowNothing: !hasValidCoordinates && !(event.location?.name)
              });
              
              return (
                <View style={styles.mapSection}>
                  <Text style={styles.sectionTitle}>Location</Text>
                  <View style={styles.mapContainer}>
                    {hasValidCoordinates ? (
                      <TouchableOpacity 
                        onPress={() => openInMaps(
                          lat, 
                          lng, 
                          event.location?.name || event.title,
                          event.location_address || event.location?.address
                        )}
                        style={styles.mapContainer}
                      >
                        <MapView
                          style={styles.map}
                          initialRegion={{
                            latitude: latNum,
                            longitude: lngNum,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                          pitchEnabled={false}
                          rotateEnabled={false}
                        >
                          <Marker
                            coordinate={{
                              latitude: latNum,
                              longitude: lngNum,
                            }}
                            title={event.location?.name || event.title}
                            description={event.location_address || event.location?.address}
                          />
                        </MapView>
                        <View style={styles.mapOverlay}>
                          <Text style={styles.mapOverlayText}>Tap to open in Maps</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.mapPlaceholderContainer}>
                        <Image
                          source={require('../../assets/icon.png')}
                          style={styles.mapPlaceholderImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.mapPlaceholder}>
                          {event.location?.name 
                            ? `Map view coming soon - coordinates needed for ${event.location.name}`
                            : 'No location information available'
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}
          </ScrollView>

        {/* RSVP & Calendar Footer */}
        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            {/* Calendar Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.calendarButton]}
              onPress={eventInCalendar ? handleRemoveFromCalendar : handleAddToCalendar}
              disabled={calendarLoading}
            >
              <Text style={styles.calendarButtonText} numberOfLines={1}>
                {calendarLoading ? 'Updating...' : eventInCalendar ? 'Remove from Calendar' : 'Add to Calendar'}
              </Text>
            </TouchableOpacity>

            {/* RSVP Button */}
            {userRSVP === 'attending' ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => handleRemoveRSVP()}
                disabled={rsvpLoading}
              >
                <Text style={styles.removeButtonText} numberOfLines={1}>
                  {rsvpLoading ? 'Removing...' : 'Remove RSVP'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.goingButton]}
                onPress={() => handleRSVP('attending')}
                disabled={rsvpLoading}
              >
                <Text style={styles.goingButtonText} numberOfLines={1}>
                  {rsvpLoading ? 'RSVPing...' : 'RSVP here'}
                </Text>
              </TouchableOpacity>
            )}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increased padding to account for footer
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#F9FAFB',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  detailsContainer: {
    padding: 20,
    paddingBottom: 120, // Extra bottom padding to allow scrolling to see all content
  },
  mapSection: {
    padding: 20,
    paddingTop: 0, // No top padding since detailsContainer already has bottom padding
  },
  locationContainer: {
    padding: 20,
    paddingTop: 0, // No top padding since detailsContainer already has bottom padding
  },
  titleSection: {
    marginBottom: 24,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 34,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  mapContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  map: {
    height: 150,
    width: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mapPlaceholder: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    padding: 20,
  },
  mapPlaceholderContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mapPlaceholderImage: {
    width: '100%',
    height: 150,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  activitiesSection: {
    marginBottom: 32,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lastActivityInGroup: {
    marginBottom: 0,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    marginLeft: 12,
  },
  activityDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  activityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityLocationIcon: {
    fontSize: 12,
  },
  activityLocationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
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
    backgroundColor: '#3B82F6',
  },
  goingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  rsvpStatusContainer: {
    alignItems: 'center',
  },
  rsvpStatusText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  rsvpStatusValue: {
    fontWeight: '600',
    color: '#10B981',
  },
  changeButton: {
    backgroundColor: '#3B82F6',
  },
  changeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarButton: {
    backgroundColor: '#10B981',
  },
  calendarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Speakers Section Styles
  speakersSection: {
    marginBottom: 32,
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
  // Businesses Section Styles
  businessesSection: {
    marginBottom: 24,
  },
  businessesScrollView: {
    marginTop: 12,
  },
  businessesScrollContent: {
    paddingRight: 20,
  },
  businessCard: {
    width: 140,
    marginRight: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessLogo: {
    marginBottom: 8,
  },
  businessLogoImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  businessLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  businessName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  businessSponsorLevel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default EventModal;
