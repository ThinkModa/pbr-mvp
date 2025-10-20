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
  RefreshControl,
} from 'react-native';
import { RSVPService } from '../services/rsvpService';
import { SpeakersService, ActivitySpeaker } from '../services/speakersService';
import AvatarComponent from './AvatarComponent';
import { BusinessesService, EventBusiness } from '../services/businessesService';
import { OrganizationsService, EventOrganization } from '../services/organizationsService';
import { EventsService } from '../services/eventsService';
import { useAuth } from '../contexts/SupabaseAuthContext';
import SpeakerModal from './SpeakerModal';
import EntityCardOverlay from './EntityCardOverlay';
import BusinessModal from './BusinessModal';
import OrganizationModal from './OrganizationModal';

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
  event_id: string;
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: { name: string } | null;
}

interface ActivityModalProps {
  visible: boolean;
  activity: Activity | null;
  event: Event | null;
  onClose: () => void;
  onRSVP: (activityId: string, status: 'attending' | 'not_attending') => void;
  onBackToEvent?: () => void; // Optional callback to go back to event
  entityCardModalVisible: boolean;
  setEntityCardModalVisible: (visible: boolean) => void;
  selectedEntity: any;
  setSelectedEntity: (entity: any) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ActivityModal: React.FC<ActivityModalProps> = ({ visible, activity, event, onClose, onRSVP, onBackToEvent, entityCardModalVisible, setEntityCardModalVisible, selectedEntity, setSelectedEntity }) => {
  const { user } = useAuth();
  
  console.log('🎯 ActivityModal render:', { 
    visible, 
    activity: activity?.title, 
    event: event?.title,
    activityId: activity?.id,
    eventId: event?.id
  });
  
  if (visible) {
    console.log('🎯 ActivityModal is visible!');
    console.log('🎯 ActivityModal props:', {
      visible,
      hasActivity: !!activity,
      hasEvent: !!event,
      activityTitle: activity?.title,
      eventTitle: event?.title
    });
  }
  
  // Debug: Check if we should render the modal
  if (visible && !activity) {
    console.log('🎯 WARNING: ActivityModal is visible but activity is null!');
  }
  
  // State for data
  const [speakers, setSpeakers] = useState<ActivitySpeaker[]>([]);
  const [businesses, setBusinesses] = useState<EventBusiness[]>([]);
  const [organizations, setOrganizations] = useState<EventOrganization[]>([]);
  const [nextActivity, setNextActivity] = useState<Activity | null>(null);
  const [activityRSVPs, setActivityRSVPs] = useState<any[]>([]);
  
  // State for modals
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [selectedBusinessContacts, setSelectedBusinessContacts] = useState<any[]>([]);
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  
  // Entity card modal state is now passed as props
  
  // State for loading
  const [refreshing, setRefreshing] = useState(false);

  // Load all data when modal opens
  useEffect(() => {
    if (visible && activity && event) {
      loadAllData();
    }
  }, [visible, activity, event]);

  const loadAllData = async () => {
    if (!activity || !event) return;
    
    try {
      await Promise.all([
        loadActivitySpeakers(),
        loadEventBusinesses(),
        loadEventOrganizations(),
        loadNextActivity(),
        loadActivityRSVPs()
      ]);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const loadActivitySpeakers = async () => {
    if (!activity) return;
    
    try {
      const activitySpeakers = await SpeakersService.getActivitySpeakers(activity.id);
      setSpeakers(activitySpeakers);
    } catch (error) {
      console.error('Error loading activity speakers:', error);
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

  const loadNextActivity = async () => {
    if (!activity || !event) return;
    
    try {
      // Get all activities for this event and find the next one after current activity
      const allActivities = await EventsService.getEventActivities(event.id);
      const currentIndex = allActivities.findIndex(a => a.id === activity.id);
      if (currentIndex >= 0 && currentIndex < allActivities.length - 1) {
        setNextActivity(allActivities[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Error loading next activity:', error);
    }
  };

  const loadActivityRSVPs = async () => {
    if (!activity) return;
    
    try {
      // Load RSVPs for this specific activity
      const rsvps = await RSVPService.getActivityRSVPs(activity.id);
      setActivityRSVPs(rsvps);
    } catch (error) {
      console.error('Error loading activity RSVPs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleSpeakerPress = (speaker: ActivitySpeaker) => {
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

  // Entity card modal handlers
  const handleSpeakerCardPress = (activitySpeaker: ActivitySpeaker) => {
    const entity = {
      id: activitySpeaker.speaker?.id || '',
      name: `${activitySpeaker.speaker?.firstName || ''} ${activitySpeaker.speaker?.lastName || ''}`.trim(),
      type: 'speaker' as const,
      role: activitySpeaker.speaker?.title,
      company: activitySpeaker.speaker?.company,
      bio: activitySpeaker.speaker?.bio,
    };
    setSelectedEntity(entity);
    setEntityCardModalVisible(true);
  };

  const handleSponsorCardPress = (item: any) => {
    if ('business' in item) {
      const entity = {
        id: item.business?.id || '',
        name: item.business?.name || '',
        type: 'sponsor' as const,
        company: item.business?.name,
        sponsorshipLevel: item.sponsorshipLevel,
        description: item.business?.description,
        website: item.business?.website,
      };
      setSelectedEntity(entity);
    } else {
      const entity = {
        id: item.organization?.id || '',
        name: item.organization?.name || '',
        type: 'sponsor' as const,
        company: item.organization?.name,
        sponsorshipLevel: item.role,
        description: item.organization?.description,
        website: item.organization?.website,
      };
      setSelectedEntity(entity);
    }
    setEntityCardModalVisible(true);
  };

  const handleNextActivityPress = () => {
    if (nextActivity) {
      // Close current modal and open next activity modal
      onClose();
      // This would need to be handled by parent component
    }
  };

  const startDate = activity ? new Date(activity.start_time + 'Z') : new Date();
  const endDate = activity ? new Date(activity.end_time + 'Z') : new Date();
  
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
    if (!user || !activity) return;
    
    try {
      await RSVPService.createActivityRSVP(activity.id, user.id, status);
      onRSVP(activity.id, status);
      // Reload RSVPs to show updated count
      await loadActivityRSVPs();
    } catch (error) {
      console.error('Activity RSVP failed:', error);
    }
  };

  // Helper functions for filtering sponsors vs vendors
  const getSponsors = () => {
    const sponsorBusinesses = businesses.filter(b => b.business?.isSponsor);
    const sponsorOrganizations = organizations.filter(o => o.organization?.isSponsor);
    return [...sponsorBusinesses, ...sponsorOrganizations];
  };

  const getVendors = () => {
    const vendorBusinesses = businesses.filter(b => !b.business?.isSponsor);
    const vendorOrganizations = organizations.filter(o => !o.organization?.isSponsor);
    return [...vendorBusinesses, ...vendorOrganizations];
  };

  return (
    <>
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
              <Text style={styles.eventBannerText}>📅 {event.title}</Text>
            </View>
          )}

          {/* Activity Details */}
          {!activity ? (
            <View style={styles.detailsContainer}>
              <Text style={styles.loadingText}>Loading activity details...</Text>
            </View>
          ) : (
          <View style={styles.detailsContainer}>
            {/* Activity Title */}
            <View style={styles.titleSection}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              {activity.is_required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              )}
            </View>

            {/* Date and Time */}
            <View style={styles.dateTimeSection}>
              <Text style={styles.dateTimeText}>
                📅 {formatDate(startDate)} • {formatTime(startDate)} - {formatTime(endDate)}
              </Text>
            </View>

            {/* Location */}
            {activity.location?.name && (
              <View style={styles.locationSection}>
                <Text style={styles.locationText}>
                  📍 {activity.location.name}
                </Text>
              </View>
            )}

            {/* Activity Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>⏱️ Duration</Text>
                <Text style={styles.infoValue}>
                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>👥 Capacity</Text>
                <Text style={styles.infoValue}>
                  {activity.current_rsvps || 0} / {activity.max_capacity || '∞'} attendees
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.description}>
                {activity.description || 'No description available.'}
              </Text>
            </View>

            {/* Speakers Section */}
            {speakers.length > 0 && (
              <View style={styles.speakersSection}>
                <Text style={styles.sectionTitle}>👥 Speakers ({speakers.length})</Text>
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
                      onPress={() => handleSpeakerCardPress(activitySpeaker)}
                    >
                      <View style={styles.speakerAvatar}>
                        {activitySpeaker.speaker?.profileImageUrl ? (
                          <Image 
                            source={{ uri: activitySpeaker.speaker.profileImageUrl }} 
                            style={styles.speakerAvatarImage} 
                          />
                        ) : (
                          <AvatarComponent
                            name={`${activitySpeaker.speaker?.firstName || ''} ${activitySpeaker.speaker?.lastName || ''}`.trim()}
                            size={50}
                            fallbackText="??"
                            forceInitials={true}
                          />
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

            {/* Sponsors Section */}
            {getSponsors().length > 0 && (
              <View style={styles.sponsorsSection}>
                <Text style={styles.sectionTitle}>🏢 Sponsors ({getSponsors().length})</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.sponsorsScrollView}
                  contentContainerStyle={styles.sponsorsScrollContent}
                >
                  {getSponsors().map((item, index) => (
                    <TouchableOpacity
                      key={`sponsor-${index}`}
                      style={styles.sponsorCard}
                      onPress={() => handleSponsorCardPress(item)}
                    >
                      <View style={styles.sponsorLogo}>
                        {('business' in item && item.business?.logoUrl) ? (
                          <Image 
                            source={{ uri: item.business.logoUrl }} 
                            style={styles.sponsorLogoImage} 
                          />
                        ) : ('organization' in item && item.organization?.logoUrl) ? (
                          <Image 
                            source={{ uri: item.organization.logoUrl }} 
                            style={styles.sponsorLogoImage} 
                          />
                        ) : (
                          <View style={styles.sponsorLogoPlaceholder}>
                            <Text style={styles.sponsorLogoText}>
                              {('business' in item ? item.business?.name : (item as EventOrganization).organization?.name)?.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sponsorName} numberOfLines={1}>
                        {'business' in item ? item.business?.name : (item as EventOrganization).organization?.name}
                      </Text>
                      <Text style={styles.sponsorLevel} numberOfLines={1}>
                        {('business' in item ? item.sponsorshipLevel : item.role) || 'Sponsor'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Vendors Section */}
            {getVendors().length > 0 && (
              <View style={styles.vendorsSection}>
                <Text style={styles.sectionTitle}>Vendors ({getVendors().length})</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.vendorsScrollView}
                  contentContainerStyle={styles.vendorsScrollContent}
                >
                  {getVendors().map((item, index) => (
                    <TouchableOpacity
                      key={`vendor-${index}`}
                      style={styles.vendorCard}
                      onPress={() => {
                        if ('business' in item) {
                          handleBusinessPress(item as EventBusiness);
                        } else {
                          handleOrganizationPress(item as EventOrganization);
                        }
                      }}
                    >
                      <View style={styles.vendorLogo}>
                        {('business' in item && item.business?.logoUrl) ? (
                          <Image 
                            source={{ uri: item.business.logoUrl }} 
                            style={styles.vendorLogoImage} 
                          />
                        ) : ('organization' in item && item.organization?.logoUrl) ? (
                          <Image 
                            source={{ uri: item.organization.logoUrl }} 
                            style={styles.vendorLogoImage} 
                          />
                        ) : (
                          <View style={styles.vendorLogoPlaceholder}>
                            <Text style={styles.vendorLogoText}>
                              {('business' in item ? item.business?.name : (item as EventOrganization).organization?.name)?.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.vendorName} numberOfLines={1}>
                        {'business' in item ? item.business?.name : (item as EventOrganization).organization?.name}
                      </Text>
                      <Text style={styles.vendorType} numberOfLines={1}>
                        {('business' in item ? item.role : item.role) || 'Vendor'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Next Activity Section */}
            {nextActivity && (
              <View style={styles.nextActivitySection}>
                <Text style={styles.sectionTitle}>📅 Next Event</Text>
                <TouchableOpacity 
                  style={styles.nextActivityCard}
                  onPress={handleNextActivityPress}
                >
                  <Text style={styles.nextActivityTitle}>{nextActivity.title}</Text>
                  <Text style={styles.nextActivityDateTime}>
                    📅 {formatDate(new Date(nextActivity.start_time + 'Z'))} • {formatTime(new Date(nextActivity.start_time + 'Z'))}
                  </Text>
                  {nextActivity.location?.name && (
                    <Text style={styles.nextActivityLocation}>
                      📍 {nextActivity.location.name}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          )}
        </ScrollView>

        {/* Action Footer */}
        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rsvpButton]}
              onPress={() => handleRSVP('attending')}
            >
              <Text style={styles.rsvpButtonText}>RSVP for Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>

    {/* Modals */}
    <SpeakerModal
      visible={speakerModalVisible}
      speaker={selectedSpeaker}
      onClose={() => setSpeakerModalVisible(false)}
    />
    
    <BusinessModal
      visible={businessModalVisible}
      business={selectedBusiness}
      contacts={selectedBusinessContacts}
      onClose={() => setBusinessModalVisible(false)}
    />
    
    <OrganizationModal
      visible={organizationModalVisible}
      organization={selectedOrganization}
      onClose={() => setOrganizationModalVisible(false)}
    />

    <EntityCardOverlay
      visible={entityCardModalVisible}
      entity={selectedEntity}
      onClose={() => setEntityCardModalVisible(false)}
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
    paddingBottom: 20,
  },
  // Event Banner
  eventBanner: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  // Content
  detailsContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  requiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  // Date and Time
  dateTimeSection: {
    marginBottom: 16,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  // Location
  locationSection: {
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  // Info Section
  infoSection: {
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  // Description
  descriptionSection: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  // Speakers Section
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
  // Sponsors Section
  sponsorsSection: {
    marginBottom: 24,
  },
  sponsorsScrollView: {
    marginTop: 12,
  },
  sponsorsScrollContent: {
    paddingRight: 20,
  },
  sponsorCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sponsorLogo: {
    marginBottom: 8,
  },
  sponsorLogoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sponsorLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorLogoText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  sponsorLevel: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  // Vendors Section
  vendorsSection: {
    marginBottom: 24,
  },
  vendorsScrollView: {
    marginTop: 12,
  },
  vendorsScrollContent: {
    paddingRight: 20,
  },
  vendorCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vendorLogo: {
    marginBottom: 8,
  },
  vendorLogoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  vendorLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorLogoText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  vendorType: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  // Next Activity Section
  nextActivitySection: {
    marginBottom: 24,
  },
  nextActivityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  nextActivityDateTime: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  nextActivityLocation: {
    fontSize: 14,
    color: '#4B5563',
  },
  // Footer
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
    borderRadius: 12,
    alignItems: 'center',
  },
  rsvpButton: {
    backgroundColor: '#111827',
  },
  rsvpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 40,
  },
});

export default ActivityModal;
