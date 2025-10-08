import React, { useState, useEffect, useRef } from 'react';
import { Speaker, CreateSpeakerData, UpdateSpeakerData, SpeakersService } from '../services/speakersService';
import { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationsService } from '../services/organizationsService';
import { EventsService, EventWithActivities } from '../services/eventsService';
import SpeakerCard from '../components/SpeakerCard';
import SpeakerListCard from '../components/SpeakerListCard';
import SpeakerForm from '../components/SpeakerForm';
import OrganizationCard from '../components/OrganizationCard';
import OrganizationListCard from '../components/OrganizationListCard';
import OrganizationForm from '../components/OrganizationForm';
import ConsistentNavigation from '../components/ConsistentNavigation';
import LocationPicker from '../components/LocationPicker';
import { ImageUploadService } from '../services/imageUploadService';

// Activity categories with colors and icons
const ACTIVITY_CATEGORIES = [
  { id: 'workshop', name: 'Workshop', color: '#3B82F6', icon: '🔧' },
  { id: 'lunch-learn', name: 'Lunch & Learn', color: '#10B981', icon: '🍽️' },
  { id: 'networking', name: 'Networking', color: '#8B5CF6', icon: '🤝' },
  { id: 'presentation', name: 'Presentation', color: '#F59E0B', icon: '📊' },
  { id: 'panel', name: 'Panel Discussion', color: '#EF4444', icon: '💬' },
  { id: 'break', name: 'Break', color: '#6B7280', icon: '☕' },
  { id: 'social', name: 'Social Event', color: '#EC4899', icon: '🎉' },
  { id: 'other', name: 'Other', color: '#9CA3AF', icon: '📝' }
];

interface Activity {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  capacity?: number;
  isRequired: boolean;
}

interface DashboardPageProps {
  onNavigate: (page: 'dashboard' | 'events' | 'speakers' | 'organizations' | 'users' | 'settings') => void;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onLogout }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'events' | 'speakers' | 'organizations' | 'users' | 'settings'>('dashboard');
  
  // Speakers state
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [showSpeakerForm, setShowSpeakerForm] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [speakerFormLoading, setSpeakerFormLoading] = useState(false);
  const [speakerSearchTerm, setSpeakerSearchTerm] = useState('');
  const [speakerViewMode, setSpeakerViewMode] = useState<'grid' | 'list'>('grid');

  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [organizationFormLoading, setOrganizationFormLoading] = useState(false);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [organizationViewMode, setOrganizationViewMode] = useState<'grid' | 'list'>('grid');

  // Events state
  const [events, setEvents] = useState<EventWithActivities[]>([]);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithActivities | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Event form state
  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: {
      name: '',
      address: '',
      coordinates: undefined as { lat: number; lng: number } | undefined,
      placeId: undefined as string | undefined
    },
    capacity: '',
    price: '',
    showCapacity: true,
    showPrice: true,
    showAttendeeCount: true,
    coverImageUrl: '',
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [eventSpeakers, setEventSpeakers] = useState<string[]>([]);
  const [eventBusinesses, setEventBusinesses] = useState<string[]>([]);

  // Load speakers when speakers view is selected
  useEffect(() => {
    if (currentView === 'speakers') {
      loadSpeakers();
    }
  }, [currentView]);

  // Load organizations when organizations view is selected
  useEffect(() => {
    if (currentView === 'organizations') {
      loadOrganizations();
    }
  }, [currentView]);

  // Load events when events view is selected
  useEffect(() => {
    if (currentView === 'events') {
      loadEvents();
    }
  }, [currentView]);

  const loadSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      setSpeakersError(null);
      const speakersData = await SpeakersService.getAllSpeakers();
      setSpeakers(speakersData);
    } catch (err) {
      console.error('Error loading speakers:', err);
      setSpeakersError('Failed to load speakers. Please try again.');
    } finally {
      setSpeakersLoading(false);
    }
  };

  const handleCreateSpeaker = async (data: CreateSpeakerData) => {
    try {
      setSpeakerFormLoading(true);
      await SpeakersService.createSpeaker(data);
      await loadSpeakers();
      setShowSpeakerForm(false);
    } catch (err) {
      console.error('Error creating speaker:', err);
      throw err;
    } finally {
      setSpeakerFormLoading(false);
    }
  };

  const handleUpdateSpeaker = async (data: UpdateSpeakerData) => {
    try {
      setSpeakerFormLoading(true);
      await SpeakersService.updateSpeaker(data);
      await loadSpeakers();
      setEditingSpeaker(null);
      setShowSpeakerForm(false);
    } catch (err) {
      console.error('Error updating speaker:', err);
      throw err;
    } finally {
      setSpeakerFormLoading(false);
    }
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    try {
      await SpeakersService.deleteSpeaker(speakerId);
      await loadSpeakers();
    } catch (err) {
      console.error('Error deleting speaker:', err);
      setSpeakersError('Failed to delete speaker. Please try again.');
    }
  };

  const handleEditSpeaker = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setShowSpeakerForm(true);
  };

  const handleCancelSpeakerForm = () => {
    setShowSpeakerForm(false);
    setEditingSpeaker(null);
  };

  // Filter speakers based on search term
  const filteredSpeakers = speakers.filter(speaker => {
    const searchLower = speakerSearchTerm.toLowerCase();
    return (
      speaker.firstName.toLowerCase().includes(searchLower) ||
      speaker.lastName.toLowerCase().includes(searchLower) ||
      speaker.email.toLowerCase().includes(searchLower) ||
      (speaker.title && speaker.title.toLowerCase().includes(searchLower)) ||
      (speaker.company && speaker.company.toLowerCase().includes(searchLower)) ||
      (speaker.bio && speaker.bio.toLowerCase().includes(searchLower)) ||
      speaker.expertise.some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  // Organizations functions
  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      setOrganizationsError(null);
      const data = await OrganizationsService.getAllOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizationsError('Failed to load organizations');
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const handleCreateOrganization = async (data: CreateOrganizationData) => {
    try {
      setOrganizationFormLoading(true);
      const newOrganization = await OrganizationsService.createOrganization(data);
      setOrganizations(prev => [...prev, newOrganization]);
      setShowOrganizationForm(false);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    } finally {
      setOrganizationFormLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: UpdateOrganizationData) => {
    try {
      setOrganizationFormLoading(true);
      const updatedOrganization = await OrganizationsService.updateOrganization(data);
      setOrganizations(prev => prev.map(org => org.id === data.id ? updatedOrganization : org));
      setShowOrganizationForm(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    } finally {
      setOrganizationFormLoading(false);
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    try {
      await OrganizationsService.deleteOrganization(organizationId);
      setOrganizations(prev => prev.filter(org => org.id !== organizationId));
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization');
    }
  };

  const handleEditOrganization = (organization: Organization) => {
    setEditingOrganization(organization);
    setShowOrganizationForm(true);
  };

  const handleCancelOrganizationForm = () => {
    setShowOrganizationForm(false);
    setEditingOrganization(null);
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(organization => {
    const searchLower = organizationSearchTerm.toLowerCase();
    return (
      organization.name.toLowerCase().includes(searchLower) ||
      (organization.description && organization.description.toLowerCase().includes(searchLower)) ||
      (organization.email && organization.email.toLowerCase().includes(searchLower)) ||
      (organization.industry && organization.industry.toLowerCase().includes(searchLower)) ||
      (organization.website && organization.website.toLowerCase().includes(searchLower)) ||
      organization.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Events functions
  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      setEventsError(null);
      const eventsData = await EventsService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      setEventsError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      setEventsLoading(true);
      await EventsService.createEvent(eventData);
      await loadEvents();
      setShowCreateEventForm(false);
      resetEventForm();
    } catch (error) {
      console.error('Error creating event:', error);
      setEventsError('Failed to create event');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    try {
      setEventsLoading(true);
      await EventsService.updateEvent(eventId, eventData);
      await loadEvents();
      setShowCreateEventForm(false);
      setEditingEvent(null);
      resetEventForm();
    } catch (error) {
      console.error('Error updating event:', error);
      setEventsError('Failed to update event');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setEventsLoading(true);
      await EventsService.deleteEvent(eventId);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setEventsError('Failed to delete event');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEditEvent = (event: EventWithActivities) => {
    setEditingEvent(event);
    setEventFormData({
      name: event.title,
      description: event.description,
      startDate: event.start_time,
      endDate: event.end_time,
      location: event.location || { name: '', address: '', coordinates: undefined, placeId: undefined },
      capacity: event.max_capacity?.toString() || '',
      price: event.price ? (event.price / 100).toString() : '',
      showCapacity: event.show_capacity,
      showPrice: event.show_price,
      showAttendeeCount: event.show_attendee_count,
      coverImageUrl: event.cover_image_url || '',
    });
    setActivities((event.activities || []).map(activity => ({
      name: activity.title,
      description: activity.description || '',
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location?.name || '',
      category: 'other', // Default category
      capacity: activity.maxCapacity?.toString() || '',
      isRequired: activity.isRequired
    })));
    setEventSpeakers([]);
    setEventBusinesses([]);
    setShowCreateEventForm(true);
  };

  const handleCancelEventForm = () => {
    setShowCreateEventForm(false);
    setEditingEvent(null);
    resetEventForm();
  };

  const resetEventForm = () => {
    setEventFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      location: { name: '', address: '', coordinates: undefined, placeId: undefined },
      capacity: '',
      price: '',
      showCapacity: true,
      showPrice: true,
      showAttendeeCount: true,
      coverImageUrl: '',
    });
    setActivities([]);
    setEventSpeakers([]);
    setEventBusinesses([]);
    setImageFile(null);
    setImagePreview('');
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setEventsLoading(true);
      setEventsError(null);

      const eventData = {
        name: eventFormData.name,
        description: eventFormData.description,
        start_date: eventFormData.startDate,
        end_date: eventFormData.endDate,
        location: eventFormData.location,
        capacity: eventFormData.capacity ? parseInt(eventFormData.capacity) : undefined,
        price: eventFormData.price ? parseFloat(eventFormData.price) : undefined,
        show_capacity: eventFormData.showCapacity,
        show_price: eventFormData.showPrice,
        show_attendee_count: eventFormData.showAttendeeCount,
        cover_image_url: eventFormData.coverImageUrl,
        activities: activities.map(activity => ({
          name: activity.name,
          description: activity.description,
          start_time: activity.startTime,
          end_time: activity.endTime,
          location: activity.location,
          category: activity.category,
          capacity: activity.capacity,
          is_required: activity.isRequired,
        })),
      };

      if (editingEvent) {
        await handleUpdateEvent(editingEvent.id, eventData);
      } else {
        await handleCreateEvent(eventData);
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      setEventsError('Failed to submit event');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setEventFormData(prev => ({ ...prev, coverImageUrl: '' }));
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;

    try {
      setUploadingImage(true);
      const imageUrl = await ImageUploadService.uploadImage(imageFile);
      setEventFormData(prev => ({ ...prev, coverImageUrl: imageUrl }));
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error uploading image:', error);
      setEventsError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addActivity = () => {
    setActivities([...activities, {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      category: 'other',
      capacity: undefined,
      isRequired: false
    }]);
  };

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    setActivities(updatedActivities);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleNavigation = (page: 'dashboard' | 'events' | 'speakers' | 'organizations' | 'users' | 'settings') => {
    setCurrentView(page);
    onNavigate(page);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Left Sidebar */}
      <div style={{ 
        width: '256px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo Section */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: 'black', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>P</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>PBR Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <ConsistentNavigation 
          currentPage={currentView} 
          onNavigate={handleNavigation} 
        />

        {/* Upcoming Events Section */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}>
            Upcoming Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Bear Hug: Live in Concert</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Six Fingers — DJ Set</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>We All Look The Same</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Viking People</div>
          </div>
        </div>

        {/* Support Section */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="#" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#6b7280', 
              textDecoration: 'none'
            }}>
              <span>❓</span>
              <span>Support</span>
            </a>
            <a href="#" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#6b7280', 
              textDecoration: 'none'
            }}>
              <span>⭐</span>
              <span>Changelog</span>
            </a>
          </div>
        </div>

        {/* User Profile */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Erica"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>Erica</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>erica@example.com</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Conditional Content Based on Current View */}
            {currentView === 'dashboard' && (
              <>
                {/* Greeting */}
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '32px' }}>
                  Good afternoon, Erica
                </h1>

            {/* Overview Section */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>Overview</h2>
                <select style={{ 
                  fontSize: '14px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  padding: '4px 12px',
                  backgroundColor: 'white'
                }}>
                  <option>Last week</option>
                  <option>Last month</option>
                  <option>Last quarter</option>
                </select>
              </div>

              {/* Metrics Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '24px', 
                marginBottom: '32px' 
              }}>
                {/* Total Revenue */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Total revenue
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    $2.6M
                  </p>
                  <p style={{ fontSize: '14px', color: '#16a34a' }}>+4.5% from last week</p>
                </div>

                {/* Average Order Value */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Average order value
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    $455
                  </p>
                  <p style={{ fontSize: '14px', color: '#dc2626' }}>-0.5% from last week</p>
                </div>

                {/* Tickets Sold */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Tickets sold
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    5,888
                  </p>
                  <p style={{ fontSize: '14px', color: '#16a34a' }}>+4.5% from last week</p>
                </div>

                {/* Pageviews */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Pageviews
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    823,067
                  </p>
                  <p style={{ fontSize: '14px', color: '#16a34a' }}>+21.2% from last week</p>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
                Recent orders
              </h2>
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Order number
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Purchase date
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Customer
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Event
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        3000
                      </td>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        color: '#6b7280',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        May 9, 2024
                      </td>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Leslie Alexander
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px' }}
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="Bear Hug"
                          />
                          <span style={{ fontSize: '14px', color: '#111827' }}>Bear Hug: Live in Concert</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        US$80.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}

            {/* Speakers View */}
            {currentView === 'speakers' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                    Speakers Management
                  </h1>
                  <button
                    onClick={() => setShowSpeakerForm(true)}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span>
                    Add Speaker
                  </button>
                </div>

                {/* Error Message */}
                {speakersError && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    color: '#DC2626'
                  }}>
                    {speakersError}
                  </div>
                )}

                {/* Search and View Toggle */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '24px',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder="Search speakers..."
                      value={speakerSearchTerm}
                      onChange={(e) => setSpeakerSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {filteredSpeakers.length} of {speakers.length} speakers
                    </div>
                    
                    {/* View Toggle */}
                    <div style={{ 
                      display: 'flex', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '6px', 
                      padding: '2px'
                    }}>
                      <button
                        onClick={() => setSpeakerViewMode('grid')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: speakerViewMode === 'grid' ? 'white' : 'transparent',
                          color: speakerViewMode === 'grid' ? '#111827' : '#6b7280',
                          boxShadow: speakerViewMode === 'grid' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setSpeakerViewMode('list')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: speakerViewMode === 'list' ? 'white' : 'transparent',
                          color: speakerViewMode === 'list' ? '#111827' : '#6b7280',
                          boxShadow: speakerViewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Modal */}
                {showSpeakerForm && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '24px',
                      maxWidth: '800px',
                      width: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <SpeakerForm
                        speaker={editingSpeaker || undefined}
                        onSubmit={editingSpeaker ? handleUpdateSpeaker : handleCreateSpeaker}
                        onCancel={handleCancelSpeakerForm}
                        isLoading={speakerFormLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {speakersLoading && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '48px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #e5e7eb',
                      borderTop: '3px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                )}

                {/* Empty State */}
                {!speakersLoading && filteredSpeakers.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '8px' 
                    }}>
                      {speakerSearchTerm ? 'No speakers found' : 'No speakers yet'}
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      marginBottom: '24px' 
                    }}>
                      {speakerSearchTerm 
                        ? 'Try adjusting your search terms.' 
                        : 'Get started by creating your first speaker profile.'
                      }
                    </p>
                    {!speakerSearchTerm && (
                      <button
                        onClick={() => setShowSpeakerForm(true)}
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Speaker
                      </button>
                    )}
                  </div>
                )}

                {/* Speakers Content */}
                {!speakersLoading && filteredSpeakers.length > 0 && (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '24px'
                  }}>
                    {speakerViewMode === 'grid' ? (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '24px' 
                      }}>
                        {filteredSpeakers.map((speaker) => (
                          <SpeakerCard
                            key={speaker.id}
                            speaker={speaker}
                            onEdit={handleEditSpeaker}
                            onDelete={handleDeleteSpeaker}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredSpeakers.map((speaker) => (
                          <SpeakerListCard
                            key={speaker.id}
                            speaker={speaker}
                            onEdit={handleEditSpeaker}
                            onDelete={handleDeleteSpeaker}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Organizations View */}
            {currentView === 'organizations' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                    Organizations Management
                  </h1>
                  <button
                    onClick={() => setShowOrganizationForm(true)}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span>
                    <span>Add Organization</span>
                  </button>
                </div>

                {/* Error Message */}
                {organizationsError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: '#dc2626', fontSize: '14px', margin: '0' }}>
                      {organizationsError}
                    </p>
                  </div>
                )}

                {/* Search and Stats */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '24px',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={organizationSearchTerm}
                      onChange={(e) => setOrganizationSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {filteredOrganizations.length} of {organizations.length} organizations
                    </div>
                    
                    {/* View Toggle */}
                    <div style={{ 
                      display: 'flex', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '6px', 
                      padding: '2px'
                    }}>
                      <button
                        onClick={() => setOrganizationViewMode('grid')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: organizationViewMode === 'grid' ? '#111827' : '#6b7280',
                          backgroundColor: organizationViewMode === 'grid' ? 'white' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: organizationViewMode === 'grid' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setOrganizationViewMode('list')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: organizationViewMode === 'list' ? '#111827' : '#6b7280',
                          backgroundColor: organizationViewMode === 'list' ? 'white' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: organizationViewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {organizationsLoading && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '3px solid #f3f4f6', 
                      borderTop: '3px solid #3b82f6', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading organizations...</p>
                  </div>
                )}

                {/* Empty State */}
                {!organizationsLoading && filteredOrganizations.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '8px' 
                    }}>
                      {organizationSearchTerm ? 'No organizations found' : 'No organizations yet'}
                    </h3>
                    <p style={{ 
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '24px'
                    }}>
                      {organizationSearchTerm 
                        ? 'Try adjusting your search terms to find organizations.'
                        : 'Get started by creating your first organization profile.'
                      }
                    </p>
                    {!organizationSearchTerm && (
                      <button
                        onClick={() => setShowOrganizationForm(true)}
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Create Organization
                      </button>
                    )}
                  </div>
                )}

                {/* Organizations Content */}
                {!organizationsLoading && filteredOrganizations.length > 0 && (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '24px'
                  }}>
                    {organizationViewMode === 'grid' ? (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '24px' 
                      }}>
                        {filteredOrganizations.map((organization) => (
                          <OrganizationCard
                            key={organization.id}
                            organization={organization}
                            onEdit={handleEditOrganization}
                            onDelete={handleDeleteOrganization}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredOrganizations.map((organization) => (
                          <OrganizationListCard
                            key={organization.id}
                            organization={organization}
                            onEdit={handleEditOrganization}
                            onDelete={handleDeleteOrganization}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Form Modal */}
                {showOrganizationForm && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      width: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <OrganizationForm
                        organization={editingOrganization || undefined}
                        onSubmit={editingOrganization ? handleUpdateOrganization : handleCreateOrganization}
                        onCancel={handleCancelOrganizationForm}
                        isLoading={organizationFormLoading}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Events View */}
            {currentView === 'events' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                    Events Management
                  </h1>
                  <button
                    onClick={() => setShowCreateEventForm(true)}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span>
                    Create Event
                  </button>
                </div>

                {/* Error Message */}
                {eventsError && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}>
                    {eventsError}
                  </div>
                )}

                {/* Events List */}
                {eventsLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '4px solid #E5E7EB',
                      borderTop: '4px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6B7280' }}>Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      No events yet
                    </h3>
                    <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                      Create your first event to get started.
                    </p>
                    <button
                      onClick={() => setShowCreateEventForm(true)}
                      style={{
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Create Event
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {events.map((event) => (
                        <div
                          key={event.id}
                          style={{
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                                {event.title}
                              </h3>
                              <p style={{ color: '#6B7280', marginBottom: '12px' }}>
                                {event.description}
                              </p>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                                <span>📅 {new Date(event.start_time).toLocaleDateString()}</span>
                                <span>📍 {event.location?.name || 'Location TBD'}</span>
                                {event.max_capacity && <span>👥 {event.max_capacity} capacity</span>}
                                {event.price && <span>💰 ${event.price / 100}</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleEditEvent(event)}
                                style={{
                                  backgroundColor: '#F3F4F6',
                                  color: '#374151',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                style={{
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {event.activities && event.activities.length > 0 && (
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                Activities ({event.activities.length})
                              </h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {event.activities.map((activity, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      backgroundColor: '#F3F4F6',
                                      color: '#374151',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px'
                                    }}
                                  >
                                    {activity.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Users View - Placeholder */}
            {currentView === 'users' && (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Users</h1>
                <p style={{ color: '#6b7280' }}>Mobile app users management will be integrated here.</p>
              </div>
            )}

            {/* Settings View - Placeholder */}
            {currentView === 'settings' && (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Settings</h1>
                <p style={{ color: '#6b7280' }}>Application settings will be integrated here.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Event Form Modal */}
      {showCreateEventForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h2>
                <button
                  onClick={handleCancelEventForm}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEventSubmit}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  {/* Event Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={eventFormData.name}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, name: e.target.value }))}
                      required={!editingEvent}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Event Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Description *
                    </label>
                    <textarea
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                      required={!editingEvent}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Event Cover Image */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Event Cover Image
                    </label>
                    {imagePreview && (
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: '8px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      📷 Select Image
                    </button>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={uploadingImage}
                        style={{
                          backgroundColor: uploadingImage ? '#9CA3AF' : '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          cursor: uploadingImage ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {uploadingImage ? (
                          <>
                            <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Uploading...
                          </>
                        ) : (
                          <>
                            📷 Upload Image
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Start Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventFormData.startDate}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required={!editingEvent}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        End Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventFormData.endDate}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required={!editingEvent}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Location
                    </label>
                    <LocationPicker
                      value={eventFormData.location}
                      onChange={(location) => setEventFormData(prev => ({ ...prev, location }))}
                      placeholder="Search for a location..."
                    />
                  </div>

                  {/* Capacity and Price */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={eventFormData.capacity}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={eventFormData.price}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, price: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Activities
                      </label>
                      <button
                        type="button"
                        onClick={addActivity}
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Activity
                      </button>
                    </div>
                    {activities.map((activity, index) => (
                      <div key={index} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            Activity {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeActivity(index)}
                            style={{
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="Activity name"
                            value={activity.name}
                            onChange={(e) => updateActivity(index, 'name', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <textarea
                            placeholder="Activity description"
                            value={activity.description}
                            onChange={(e) => updateActivity(index, 'description', e.target.value)}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input
                              type="datetime-local"
                              placeholder="Start time"
                              value={activity.startTime}
                              onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #D1D5DB',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}
                            />
                            <input
                              type="datetime-local"
                              placeholder="End time"
                              value={activity.endTime}
                              onChange={(e) => updateActivity(index, 'endTime', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #D1D5DB',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Location"
                            value={activity.location}
                            onChange={(e) => updateActivity(index, 'location', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <select
                            value={activity.category}
                            onChange={(e) => updateActivity(index, 'category', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          >
                            {ACTIVITY_CATEGORIES.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                  <button
                    type="button"
                    onClick={handleCancelEventForm}
                    style={{
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={eventsLoading}
                    style={{
                      backgroundColor: eventsLoading ? '#9CA3AF' : '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: eventsLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;