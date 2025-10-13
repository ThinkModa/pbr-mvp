import React, { useState, useEffect, useRef } from 'react';
import { Speaker, CreateSpeakerData, UpdateSpeakerData, SpeakersService } from '../services/speakersService';
import { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationsService } from '../services/organizationsService';
import { EventsService, EventWithActivities } from '../services/eventsService';
import { supabase } from '../lib/supabase';
import SpeakerCard from '../components/SpeakerCard';
import SpeakerListCard from '../components/SpeakerListCard';
import SpeakerForm from '../components/SpeakerForm';
import OrganizationCard from '../components/OrganizationCard';
import OrganizationListCard from '../components/OrganizationListCard';
import OrganizationForm from '../components/OrganizationForm';
import ConsistentNavigation from '../components/ConsistentNavigation';
import LocationPicker from '../components/LocationPicker';
import TrackManagement from '../components/TrackManagement';
import { ImageUploadService } from '../services/imageUploadService';
import BulkImportService, { ImportUser, FieldMapping, ImportResult } from '../services/bulkImportService';
import ManualUserCreation from '../components/ManualUserCreation';
import { UserRoleManagement } from '../components/UserRoleManagement';

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

// Generate time options in 15-minute increments with 12-hour format (8am to 9pm only)
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 8; hour <= 21; hour++) { // 8am to 9pm (21:00)
    for (let minute = 0; minute < 60; minute += 15) {
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      
      const time12Hour = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const time24Hour = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      times.push({
        label: time12Hour,
        value: time24Hour
      });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

interface Activity {
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
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
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithActivities[]>([]);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithActivities | null>(null);
  const [selectedEventForTracks, setSelectedEventForTracks] = useState<EventWithActivities | null>(null);
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersView, setUsersView] = useState<'list' | 'bulk-import' | 'role-management'>('list');
  const [showManualUserCreation, setShowManualUserCreation] = useState(false);

  // Bulk import state
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedUsers, setParsedUsers] = useState<ImportUser[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [mappedUsers, setMappedUsers] = useState<ImportUser[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'import' | 'complete'>('upload');
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Event form state
  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
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
    hasTracks: false,
    coverImageUrl: '',
    status: 'published' as 'draft' | 'published' | 'cancelled' | 'completed',
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

  // Load users when users view is selected
  useEffect(() => {
    if (currentView === 'users') {
      loadUsers();
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
      
      // Get the 3 most upcoming events
      const now = new Date();
      const upcoming = eventsData
        .filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate > now;
        })
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 3);
      
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error loading events:', error);
      setEventsError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  // Users functions
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      
      // Use the roleManagement utility to get all users with their roles
      const { roleManagement } = await import('../utils/roleManagement');
      const result = await roleManagement.getAllUsersWithRoles();
      
      if (result.success) {
        setUsers(result.users);
        console.log('✅ Loaded users:', result.users.length);
      } else {
        setUsersError(result.error || 'Failed to load users');
        console.error('❌ Error loading users:', result.error);
      }
    } catch (error) {
      console.error('❌ Exception loading users:', error);
      setUsersError('Failed to load users');
    } finally {
      setUsersLoading(false);
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
    
    // Parse datetime strings into separate date and time
    const startDateTime = new Date(event.start_time);
    const endDateTime = new Date(event.end_time);
    
    setEventFormData({
      name: event.title,
      description: event.description,
      startDate: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toTimeString().slice(0, 5),
      endDate: endDateTime.toISOString().split('T')[0],
      endTime: endDateTime.toTimeString().slice(0, 5),
      location: event.location || { name: '', address: '', coordinates: undefined, placeId: undefined },
      capacity: event.max_capacity?.toString() || '',
      price: event.price ? (event.price / 100).toString() : '',
      showCapacity: event.show_capacity,
      showPrice: event.show_price,
      showAttendeeCount: event.show_attendee_count,
      hasTracks: event.has_tracks,
      coverImageUrl: event.cover_image_url || '',
      status: (event as any).status || 'published',
    });
    
    // Set image preview for existing images
    if (event.cover_image_url) {
      setImagePreview(event.cover_image_url);
    } else {
      setImagePreview('');
    }
    setActivities((event.activities || []).map(activity => {
      const startDateTime = new Date(activity.start_time);
      const endDateTime = new Date(activity.end_time);
      
      return {
        name: activity.title,
        description: activity.description || '',
        startDate: startDateTime.toISOString().split('T')[0],
        startTime: startDateTime.toTimeString().slice(0, 5),
        endDate: endDateTime.toISOString().split('T')[0],
        endTime: endDateTime.toTimeString().slice(0, 5),
        location: activity.location?.name || '',
        category: 'other', // Default category
        capacity: activity.max_capacity?.toString() || '',
        isRequired: activity.is_required
      };
    }));
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
      startTime: '',
      endDate: '',
      endTime: '',
      location: { name: '', address: '', coordinates: undefined, placeId: undefined },
      capacity: '',
      price: '',
      showCapacity: true,
      showPrice: true,
      showAttendeeCount: true,
      hasTracks: false,
      coverImageUrl: '',
      status: 'published',
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
        start_date: `${eventFormData.startDate}T${eventFormData.startTime}:00`,
        end_date: `${eventFormData.endDate}T${eventFormData.endTime}:00`,
        location: eventFormData.location,
        capacity: eventFormData.capacity ? parseInt(eventFormData.capacity) : undefined,
        price: eventFormData.price ? parseFloat(eventFormData.price) : undefined,
        show_capacity: eventFormData.showCapacity,
        show_price: eventFormData.showPrice,
        show_attendee_count: eventFormData.showAttendeeCount,
        has_tracks: eventFormData.hasTracks,
        cover_image_url: eventFormData.coverImageUrl,
        status: eventFormData.status,
        activities: activities
          .filter(activity => activity.name.trim() !== '' && activity.startDate && activity.startTime && activity.endDate && activity.endTime)
          .map(activity => ({
            name: activity.name,
            description: activity.description,
            start_time: `${activity.startDate}T${activity.startTime}:00`,
            end_time: `${activity.endDate}T${activity.endTime}:00`,
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = ImageUploadService.validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Automatically upload the image
    setUploadingImage(true);
    try {
      const imageUrl = await ImageUploadService.uploadImage(file, 'events');
      setEventFormData(prev => ({ ...prev, coverImageUrl: imageUrl }));
      setImageFile(null);
      setImagePreview('');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('✅ Image uploaded automatically');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
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
      startDate: '',
      startTime: '',
      endDate: '',
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

  // Bulk import handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      try {
        const users = BulkImportService.parseCSV(content);
        setParsedUsers(users);
        setImportError('');
        setImportStep('mapping');
      } catch (err) {
        setImportError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFieldMapping = () => {
    try {
      const mapped = BulkImportService.mapFields(parsedUsers, fieldMappings);
      // Validate the mapped users to show any issues in preview
      const { validUsers, errors } = BulkImportService.validateUsers(mapped);
      setMappedUsers(validUsers);
      setImportStep('preview');
      
      // Show validation errors as warnings
      if (errors.length > 0) {
        console.warn('Validation errors found:', errors);
      }
    } catch (err) {
      setImportError(`Failed to map fields: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async () => {
    setImportLoading(true);
    setImportError('');
    
    try {
      console.log('🚀 Starting import with users:', mappedUsers.length);
      const result = await BulkImportService.importUsers(mappedUsers);
      console.log('📊 Import result:', result);
      setImportResult(result);
      setImportStep('complete');
      
      // Refresh pending users list
      console.log('🔄 Refreshing pending users list...');
      const pending = await BulkImportService.getPendingUsers();
      console.log('👥 Retrieved pending users:', pending.length);
      setPendingUsers(pending);
    } catch (err) {
      console.error('❌ Import failed:', err);
      setImportError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSendInvitations = async (userIds: string[]) => {
    setImportLoading(true);
    setImportError('');
    
    try {
      await BulkImportService.sendInvitations(userIds);
      
      // Refresh pending users list
      const pending = await BulkImportService.getPendingUsers();
      setPendingUsers(pending);
    } catch (err) {
      setImportError(`Failed to send invitations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportStep('upload');
    setCsvContent('');
    setParsedUsers([]);
    setFieldMappings([]);
    setMappedUsers([]);
    setImportResult(null);
    setImportError('');
  };

  const getCsvHeaders = (): string[] => {
    if (!csvContent) return [];
    const firstLine = csvContent.split('\n')[0];
    return firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
  };

  const updateFieldMapping = (csvColumn: string, userField: string) => {
    setFieldMappings(prev => {
      const existing = prev.find(m => m.csvColumn === csvColumn);
      if (existing) {
        return prev.map(m => 
          m.csvColumn === csvColumn ? { ...m, userField } : m
        );
      } else {
        return [...prev, { csvColumn, userField, required: false }];
      }
    });
  };

  const removeFieldMapping = (csvColumn: string) => {
    setFieldMappings(prev => prev.filter(m => m.csvColumn !== csvColumn));
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
            {upcomingEvents.length === 0 ? (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>No upcoming events</div>
            ) : (
              upcomingEvents.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => setCurrentView('events')}
                  style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px 0',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.color = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  {event.title}
                </div>
              ))
            )}
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

            {/* Users View */}
            {currentView === 'users' && (
              <>
                {console.log('DashboardPage: Users View is being rendered, usersView is:', usersView)}
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                    Users Management
                  </h1>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setShowManualUserCreation(true)}
                      style={{
                        backgroundColor: '#10B981',
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
                      <span>➕</span>
                      Create User
                    </button>
                    <button
                      onClick={() => setUsersView('list')}
                      style={{
                        backgroundColor: usersView === 'list' ? '#3B82F6' : '#F3F4F6',
                        color: usersView === 'list' ? 'white' : '#374151',
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
                      <span>👥</span>
                      All Users
                    </button>
                    <button
                      onClick={() => setUsersView('bulk-import')}
                      style={{
                        backgroundColor: usersView === 'bulk-import' ? '#3B82F6' : '#F3F4F6',
                        color: usersView === 'bulk-import' ? 'white' : '#374151',
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
                      <span>📊</span>
                      Bulk Import
                    </button>
                  </div>
                </div>

                {/* Users List View */}
                {usersView === 'list' && (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #E5E7EB' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                        All Users
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                            View Mode
                          </label>
                          <select style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}>
                            <option value="all">All RSVPs</option>
                            <option value="unique">Unique Users</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                            Event
                          </label>
                          <select style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}>
                            <option value="">All Events</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                            Status
                          </label>
                          <select style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}>
                            <option value="">All Statuses</option>
                            <option value="attending">Attending</option>
                            <option value="pending">Pending</option>
                            <option value="not_attending">Not Attending</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'end' }}>
                          <button
                            style={{
                              width: '100%',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Users Table */}
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ backgroundColor: '#F9FAFB' }}>
                            <tr>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                User
                              </th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Contact
                              </th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Events
                              </th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Role
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersLoading ? (
                              <tr style={{ borderTop: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }} colSpan={4}>
                                  Loading users...
                                </td>
                              </tr>
                            ) : usersError ? (
                              <tr style={{ borderTop: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '16px', textAlign: 'center', color: '#DC2626' }} colSpan={4}>
                                  Error: {usersError}
                                </td>
                              </tr>
                            ) : users.length === 0 ? (
                              <tr style={{ borderTop: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }} colSpan={4}>
                                  No users found. Use the "Create User" button or Bulk Import tab to add users.
                                </td>
                              </tr>
                            ) : (
                              users.map((user) => (
                                <tr key={user.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                                  <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                          {user.first_name} {user.last_name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                          {user.title_position || 'No title'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: '14px', color: '#111827' }}>
                                      {user.email}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                      {user.phone_number || 'No phone'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px', color: '#6B7280', fontSize: '14px' }}>
                                    <span style={{ 
                                      padding: '4px 8px', 
                                      borderRadius: '4px', 
                                      fontSize: '12px', 
                                      fontWeight: '500',
                                      backgroundColor: '#E5E7EB',
                                      color: '#6B7280'
                                    }}>
                                      {user.events_attended || 0} events
                                    </span>
                                  </td>
                                  <td style={{ padding: '16px' }}>
                                    <select
                                      value={user.role || 'general'}
                                      onChange={async (e) => {
                                        const newRole = e.target.value as 'admin' | 'business' | 'general';
                                        try {
                                          // Use the roleManagement utility to change the role
                                          const { roleManagement } = await import('../utils/roleManagement');
                                          const result = await roleManagement.changeUserRole(
                                            user.id,
                                            newRole,
                                            '11111111-1111-1111-1111-111111111111', // Mock admin user ID
                                          );
                                          
                                          if (result.success) {
                                            // Update local state
                                            setUsers(prevUsers => 
                                              prevUsers.map(u => 
                                                u.id === user.id ? { ...u, role: newRole } : u
                                              )
                                            );
                                            alert(`User role updated to ${newRole}`);
                                          } else {
                                            alert(`Failed to update role: ${result.error}`);
                                          }
                                        } catch (error) {
                                          console.error('Error changing user role:', error);
                                          alert('Error changing user role');
                                        }
                                      }}
                                      style={{
                                        padding: '6px 10px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                        minWidth: '100px'
                                      }}
                                    >
                                      <option value="general">General</option>
                                      <option value="business">Business</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk Import View */}
                {usersView === 'bulk-import' && (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #E5E7EB' }}>
                    {/* Progress Steps */}
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {['Upload CSV', 'Map Fields', 'Preview', 'Import', 'Complete'].map((stepName, index) => {
                          const stepIndex = ['upload', 'mapping', 'preview', 'import', 'complete'].indexOf(importStep);
                          const isActive = index <= stepIndex;
                          const isCurrent = index === stepIndex;
                          
                          return (
                            <div key={stepName} style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: '500',
                                backgroundColor: isActive ? '#3B82F6' : '#E5E7EB',
                                color: isActive ? 'white' : '#6B7280'
                              }}>
                                {index + 1}
                              </div>
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: isCurrent ? '#3B82F6' : isActive ? '#374151' : '#9CA3AF'
                              }}>
                                {stepName}
                              </span>
                              {index < 4 && (
                                <div style={{
                                  width: '64px',
                                  height: '2px',
                                  margin: '0 16px',
                                  backgroundColor: isActive ? '#3B82F6' : '#E5E7EB'
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {importError && (
                      <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                        <p style={{ color: '#DC2626' }}>{importError}</p>
                      </div>
                    )}

                    {/* Step 1: Upload CSV */}
                    {importStep === 'upload' && (
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                          Upload CSV File
                        </h2>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                          Upload a CSV file to import multiple users at once. <strong>Required columns: email, phone_number</strong>. 
                          First and last names will be generated from email if not provided. Other fields are optional and can be completed by users when they sign up.
                        </p>
                        
                        <div style={{ border: '2px dashed #D1D5DB', borderRadius: '8px', padding: '32px', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            id="csv-upload"
                          />
                          <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                            <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                              Upload CSV File
                            </h3>
                            <p style={{ color: '#6B7280', marginBottom: '16px' }}>
                              Drag and drop your CSV file here, or click to browse
                            </p>
                            <div style={{
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '12px 24px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'inline-block'
                            }}>
                              Choose File
                            </div>
                          </label>
                        </div>

                        {/* Sample CSV Info */}
                        <div style={{ marginTop: '24px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#0C4A6E', marginBottom: '8px' }}>
                            Sample CSV Format
                          </h4>
                          <div style={{ fontSize: '12px', color: '#0C4A6E', fontFamily: 'monospace', backgroundColor: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                            first_name,last_name,email,phone,title_position<br/>
                            John,Doe,john.doe@example.com,555-0101,Software Engineer<br/>
                            Jane,Smith,jane.smith@example.com,555-0102,Product Manager
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Field Mapping */}
                    {importStep === 'mapping' && (
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                          Map CSV Columns to User Fields
                        </h2>
                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
                          <p style={{ color: '#0369A1', fontSize: '14px', margin: 0 }}>
                            <strong>💡 Tip:</strong> Only <strong>Email</strong> and <strong>Phone Number</strong> are required. 
                            First and last names will be automatically generated from email addresses if not provided. 
                            All other fields are optional and can be completed by users when they sign up.
                          </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          {getCsvHeaders().map(header => (
                            <div key={header} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                CSV Column: "{header}"
                              </label>
                              <select
                                value={fieldMappings.find(m => m.csvColumn === header)?.userField || ''}
                                onChange={(e) => updateFieldMapping(header, e.target.value)}
                                style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}
                              >
                                <option value="">Select user field...</option>
                                {BulkImportService.getAvailableFields().map(field => (
                                  <option key={field.field} value={field.field}>
                                    {field.label} {field.required && '*'}
                                  </option>
                                ))}
                              </select>
                              {fieldMappings.find(m => m.csvColumn === header) && (
                                <button
                                  onClick={() => removeFieldMapping(header)}
                                  style={{ marginTop: '8px', color: '#DC2626', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                  Remove mapping
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <button
                            onClick={() => setImportStep('upload')}
                            style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#374151', backgroundColor: 'white', cursor: 'pointer' }}
                          >
                            Back
                          </button>
                          <button
                            onClick={handleFieldMapping}
                            style={{ padding: '8px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Preview Import
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Preview */}
                    {importStep === 'preview' && (
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                          Preview Import ({mappedUsers.length} users)
                        </h2>
                        <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                          <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Mapped Fields:</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
                            {fieldMappings.map(mapping => (
                              <div key={mapping.csvColumn} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6B7280' }}>"{mapping.csvColumn}"</span>
                                <span style={{ color: '#111827' }}>→ {mapping.userField}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ maxHeight: '256px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px' }}>
                          <table style={{ width: '100%', fontSize: '14px' }}>
                            <thead style={{ backgroundColor: '#F9FAFB', position: 'sticky', top: 0 }}>
                              <tr>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>First Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Last Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Phone</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Title</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mappedUsers.slice(0, 10).map((user, index) => (
                                <tr key={index} style={{ borderTop: '1px solid #E5E7EB' }}>
                                  <td style={{ padding: '12px' }}>{user.first_name}</td>
                                  <td style={{ padding: '12px' }}>{user.last_name}</td>
                                  <td style={{ padding: '12px' }}>{user.email}</td>
                                  <td style={{ padding: '12px' }}>{user.phone || '-'}</td>
                                  <td style={{ padding: '12px' }}>{user.title_position || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {mappedUsers.length > 10 && (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                              ... and {mappedUsers.length - 10} more users
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <button
                            onClick={() => setImportStep('mapping')}
                            style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#374151', backgroundColor: 'white', cursor: 'pointer' }}
                          >
                            Back
                          </button>
                          <button
                            onClick={handleImport}
                            disabled={importLoading}
                            style={{ 
                              padding: '8px 24px', 
                              backgroundColor: importLoading ? '#9CA3AF' : '#10B981', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: importLoading ? 'not-allowed' : 'pointer' 
                            }}
                          >
                            {importLoading ? 'Importing...' : 'Import Users'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Import Complete */}
                    {importStep === 'complete' && importResult && (
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                          Import Complete
                        </h2>
                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{importResult.totalRows}</div>
                              <div style={{ fontSize: '14px', color: '#6B7280' }}>Total Rows</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{importResult.successfulImports}</div>
                              <div style={{ fontSize: '14px', color: '#6B7280' }}>Successful</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#DC2626' }}>{importResult.failedImports}</div>
                              <div style={{ fontSize: '14px', color: '#6B7280' }}>Failed</div>
                            </div>
                          </div>
                        </div>

                        {importResult.errors.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Errors:</h4>
                            <div style={{ maxHeight: '128px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                              {importResult.errors.map((error, index) => (
                                <div key={index} style={{ padding: '8px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>
                                  <span style={{ fontWeight: '500' }}>Row {error.row}:</span> {error.error}
                                  {error.email && <span style={{ color: '#6B7280' }}> ({error.email})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <button
                            onClick={resetImport}
                            style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#374151', backgroundColor: 'white', cursor: 'pointer' }}
                          >
                            Import More Users
                          </button>
                          <button
                            onClick={() => setUsersView('list')}
                            style={{ padding: '8px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            View Users
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Quick Actions Section - Only show on dashboard */}
            {currentView === 'dashboard' && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Quick Actions
                </h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
                    <span>📅</span>
                    Create Event
                  </button>
                  <button
                    onClick={() => handleNavigation('users')}
                    style={{
                      backgroundColor: '#8B5CF6',
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
                    <span>👥</span>
                    Manage Users
                  </button>
                </div>
              </div>
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
                              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280', flexWrap: 'wrap' }}>
                                <span>📅 {new Date(event.start_time).toLocaleDateString()}</span>
                                <span>📍 {event.location?.name || 'Location TBD'}</span>
                                {event.max_capacity && <span>👥 {event.max_capacity} capacity</span>}
                                {event.price && <span>💰 ${event.price / 100}</span>}
                                {event.has_tracks && (
                                  <span style={{ 
                                    backgroundColor: '#3B82F6', 
                                    color: 'white', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}>
                                    🎯 Track Selection Required
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {event.has_tracks && (
                                <button
                                  onClick={() => setSelectedEventForTracks(event)}
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
                                  Manage Tracks
                                </button>
                              )}
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
                                {event.has_tracks && (
                                  <span style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '400', 
                                    color: '#6B7280',
                                    marginLeft: '8px'
                                  }}>
                                    - Use "Manage Tracks" to assign activities to specific tracks
                                  </span>
                                )}
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
                      disabled={uploadingImage}
                      style={{
                        backgroundColor: uploadingImage ? '#9CA3AF' : '#F3F4F6',
                        color: uploadingImage ? '#6B7280' : '#374151',
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
                          <div style={{ width: '16px', height: '16px', border: '2px solid #6B7280', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          📷 Select Image
                        </>
                      )}
                    </button>
                  </div>

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


                  {/* Date and Time */}
                  {/* Start Date & Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Start Date & Time *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input
                        type="date"
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
                      <select
                        value={eventFormData.startTime}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        required={!editingEvent}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Select start time</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      End Date & Time *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input
                        type="date"
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
                      <select
                        value={eventFormData.endTime}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        required={!editingEvent}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Select end time</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
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

                  {/* Event Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Event Status
                    </label>
                    <select
                      value={eventFormData.status}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'cancelled' | 'completed' }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
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

                  {/* Track Settings */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Track Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          name="hasTracks"
                          checked={eventFormData.hasTracks}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, hasTracks: e.target.checked }))}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>This event requires track selection for RSVPs</span>
                      </label>
                      {eventFormData.hasTracks && (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#F0F9FF', 
                          border: '1px solid #3B82F6', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#1E40AF'
                        }}>
                          <strong>Track Selection Enabled:</strong> Attendees will need to select a track before their RSVP is confirmed. You can create and manage tracks after saving this event.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visibility Controls */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Visibility Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          name="showCapacity"
                          checked={eventFormData.showCapacity}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, showCapacity: e.target.checked }))}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>Show capacity to attendees</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          name="showPrice"
                          checked={eventFormData.showPrice}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, showPrice: e.target.checked }))}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>Show price to attendees</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          name="showAttendeeCount"
                          checked={eventFormData.showAttendeeCount}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, showAttendeeCount: e.target.checked }))}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>Show attendee count to attendees</span>
                      </label>
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
                    {eventFormData.hasTracks && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#F0F9FF',
                        border: '1px solid #3B82F6',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        color: '#1E40AF'
                      }}>
                        <strong>Track Assignment:</strong> After saving this event, you can assign these activities to specific tracks using the "Manage Tracks" button. Activities not assigned to tracks will be available to all attendees.
                      </div>
                    )}
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #F59E0B',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      color: '#92400E'
                    }}>
                      <strong>Required Fields:</strong> Activity name, start date, start time, end date, and end time are required. Activities with missing required fields will be skipped when saving.
                      {activities.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          {(() => {
                            const validActivities = activities.filter(activity => 
                              activity.name.trim() !== '' && activity.startDate && activity.startTime && activity.endDate && activity.endTime
                            ).length;
                            const totalActivities = activities.length;
                            return `${validActivities} of ${totalActivities} activities will be saved`;
                          })()}
                        </div>
                      )}
                    </div>
                    {activities.map((activity, index) => {
                      const isValid = activity.name.trim() !== '' && activity.startDate && activity.startTime && activity.endDate && activity.endTime;
                      return (
                      <div key={index} style={{ 
                        border: `1px solid ${isValid ? '#E5E7EB' : '#FCA5A5'}`, 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '12px',
                        backgroundColor: isValid ? 'white' : '#FEF2F2'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
                              Activity {index + 1}
                            </h4>
                            {!isValid && (
                              <span style={{
                                backgroundColor: '#FCA5A5',
                                color: '#DC2626',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '500'
                              }}>
                                Missing Required Fields
                              </span>
                            )}
                          </div>
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
                          {/* Start Date & Time */}
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                              Start Date & Time *
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input
                                type="date"
                                value={activity.startDate}
                                onChange={(e) => updateActivity(index, 'startDate', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '14px'
                                }}
                              />
                              <select
                                value={activity.startTime}
                                onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="">Start time</option>
                                {TIME_OPTIONS.map(time => (
                                  <option key={time.value} value={time.value}>
                                    {time.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* End Date & Time */}
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                              End Date & Time *
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input
                                type="date"
                                value={activity.endDate}
                                onChange={(e) => updateActivity(index, 'endDate', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '14px'
                                }}
                              />
                              <select
                                value={activity.endTime}
                                onChange={(e) => updateActivity(index, 'endTime', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="">End time</option>
                                {TIME_OPTIONS.map(time => (
                                  <option key={time.value} value={time.value}>
                                    {time.label}
                                  </option>
                                ))}
                              </select>
                            </div>
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
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input
                              type="number"
                              placeholder="Capacity (optional)"
                              value={activity.capacity}
                              onChange={(e) => updateActivity(index, 'capacity', e.target.value)}
                              min="1"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #D1D5DB',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                              <input
                                type="checkbox"
                                checked={activity.isRequired}
                                onChange={(e) => updateActivity(index, 'isRequired', e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <span style={{ fontSize: '14px', color: '#374151' }}>Required</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      )
                    })}
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

      {/* Track Management Modal */}
      {selectedEventForTracks && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90vw',
            height: '90vh',
            maxWidth: '1200px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <TrackManagement
              event={selectedEventForTracks}
              onClose={() => setSelectedEventForTracks(null)}
              onEventUpdated={() => {
                loadEvents();
                setSelectedEventForTracks(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Manual User Creation Modal */}
      {showManualUserCreation && (
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
          <ManualUserCreation
            onUserCreated={() => {
              loadUsers();
              setShowManualUserCreation(false);
            }}
            onClose={() => setShowManualUserCreation(false)}
          />
        </div>
      )}

    </div>
  );
};

export default DashboardPage;