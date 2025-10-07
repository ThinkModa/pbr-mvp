import React, { useState, useEffect } from 'react';
import { EventsService, EventWithActivities } from '../services/eventsService';

// Activity categories with colors and icons
const ACTIVITY_CATEGORIES = [
  { id: 'workshop', name: 'Workshop', color: '#3B82F6', icon: '🔧' },
  { id: 'lunch-learn', name: 'Lunch & Learn', color: '#10B981', icon: '🍽️' },
  { id: 'walking-tour', name: 'Walking Tour', color: '#8B5CF6', icon: '🚶' },
  { id: 'driving-tour', name: 'Driving Tour', color: '#F59E0B', icon: '🚗' },
  { id: 'fireside-chat', name: 'Fireside Chat', color: '#EF4444', icon: '🔥' },
  { id: 'panel-discussion', name: 'Panel Discussion', color: '#06B6D4', icon: '💬' },
  { id: 'networking', name: 'Networking', color: '#84CC16', icon: '🤝' },
];

interface Activity {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  capacity?: number;
  isRequired: boolean;
}

interface EventsPageProps {
  onNavigate: (page: 'dashboard' | 'events' | 'speakers') => void;
  onLogout: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ onNavigate, onLogout }) => {
  const [events, setEvents] = useState<EventWithActivities[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithActivities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    capacity: '',
    price: '',
    showCapacity: true,
    showPrice: true,
    showAttendeeCount: true,
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<string[]>([]);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await EventsService.getEvents();
      setEvents(eventsData);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      category: 'workshop',
      capacity: undefined,
      isRequired: false,
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const eventData = {
        name: formData.name,
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        location: formData.location,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        show_capacity: formData.showCapacity,
        show_price: formData.showPrice,
        show_attendee_count: formData.showAttendeeCount,
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

      console.log('Saving event with visibility settings:', {
        show_capacity: eventData.show_capacity,
        show_price: eventData.show_price,
        show_attendee_count: eventData.show_attendee_count
      });

      if (editingEvent) {
        await EventsService.updateEvent(editingEvent.id, eventData);
      } else {
        await EventsService.createEvent(eventData);
      }

      // Reload events to get the latest data
      await loadEvents();

      // Reset form
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        capacity: '',
        price: '',
        showCapacity: true,
        showPrice: true,
        showAttendeeCount: true,
      });
      setActivities([]);
      setSpeakers([]);
      setBusinesses([]);
      setShowCreateForm(false);
      setEditingEvent(null);
    } catch (err) {
      setError('Failed to save event. Please try again.');
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  const editEvent = (event: EventWithActivities) => {
    setEditingEvent(event);
    
    // Convert database timestamps to datetime-local format (YYYY-MM-DDTHH:MM)
    const formatForDateTimeLocal = (timestamp: string) => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setFormData({
      name: event.title,
      description: event.description,
      startDate: formatForDateTimeLocal(event.start_time),
      endDate: formatForDateTimeLocal(event.end_time),
      location: event.location?.name || '',
      capacity: event.max_capacity?.toString() || '',
      price: event.price ? (event.price / 100).toString() : '', // Convert from cents
      showCapacity: event.show_capacity ?? true,
      showPrice: event.show_price ?? true,
      showAttendeeCount: event.show_attendee_count ?? true,
    });
    setActivities(event.activities.map(activity => ({
      id: activity.id,
      name: activity.title,
      description: activity.description,
      startTime: activity.start_time,
      endTime: activity.end_time,
      location: activity.location?.name || '',
      category: 'workshop', // Default category since it's not in the schema yet
      capacity: activity.max_capacity,
      isRequired: activity.is_required,
    })));
    setSpeakers([]); // TODO: Implement speakers
    setBusinesses([]); // TODO: Implement businesses
    setShowCreateForm(true);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await EventsService.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      setError('Failed to delete event. Please try again.');
      console.error('Error deleting event:', err);
    } finally {
      setLoading(false);
    }
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
        <nav style={{ flex: 1, padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => onNavigate('dashboard')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#6b7280', 
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>🏠</span>
              <span>Home</span>
            </button>
            <button
              onClick={() => onNavigate('events')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#111827', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>📅</span>
              <span>Events</span>
            </button>
            <button
              onClick={() => onNavigate('speakers')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#6b7280', 
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>🎤</span>
              <span>Speakers</span>
            </button>
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
              <span>👥</span>
              <span>Users</span>
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
              <span>⚙️</span>
              <span>Settings</span>
            </a>
          </div>
        </nav>

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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                Events Management
              </h1>
              <button
                onClick={() => setShowCreateForm(true)}
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
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                color: '#DC2626'
              }}>
                {error}
              </div>
            )}

            {/* Events List */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              {loading ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    No events yet
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                    Create your first event to get started
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
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
                    {events.map(event => (
                      <div key={event.id} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '24px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                              {event.title}
                            </h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                              {new Date(event.start_time).toLocaleDateString()} - {new Date(event.end_time).toLocaleDateString()}
                            </p>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>
                              📍 {event.location?.name || 'Location TBD'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => editEvent(event)}
                              style={{
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
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              style={{
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
                          {event.description}
                        </p>

                        {event.activities.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                              Activities ({event.activities.length})
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {event.activities.map(activity => {
                                const category = ACTIVITY_CATEGORIES.find(cat => cat.id === activity.category);
                                return (
                                  <span
                                    key={activity.id}
                                    style={{
                                      backgroundColor: category?.color + '20',
                                      color: category?.color,
                                      border: `1px solid ${category?.color}40`,
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      fontWeight: '500'
                                    }}
                                  >
                                    {category?.icon} {activity.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                          {event.max_capacity && (
                            <span>
                              👥 Capacity: {event.max_capacity} 
                              {!event.show_capacity && <span style={{ color: '#EF4444' }}> (Hidden)</span>}
                            </span>
                          )}
                          {event.price && (
                            <span>
                              💰 Price: ${(event.price / 100).toFixed(2)}
                              {!event.show_price && <span style={{ color: '#EF4444' }}> (Hidden)</span>}
                            </span>
                          )}
                          <span>
                            👥 Attendees: {event.current_rsvps}
                            {!event.show_attendee_count && <span style={{ color: '#EF4444' }}> (Hidden)</span>}
                          </span>
                          <span>📅 Created: {new Date(event.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Event Modal */}
      {showCreateForm && (
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
            padding: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingEvent(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Event Information */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Event Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Event Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {/* Visibility Controls */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                    Visibility Settings
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="showCapacity"
                        checked={formData.showCapacity}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        Show capacity to users
                      </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="showPrice"
                        checked={formData.showPrice}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        Show price to users
                      </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="showAttendeeCount"
                        checked={formData.showAttendeeCount}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        Show attendee count to users
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Activities Section */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Activities
                  </h3>
                  <button
                    type="button"
                    onClick={addActivity}
                    style={{
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Activity
                  </button>
                </div>

                {activities.map((activity, index) => (
                  <div key={activity.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        Activity {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeActivity(activity.id)}
                        style={{
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                          Activity Name *
                        </label>
                        <input
                          type="text"
                          value={activity.name}
                          onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                          Category *
                        </label>
                        <select
                          value={activity.category}
                          onChange={(e) => updateActivity(activity.id, 'category', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
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

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Description
                      </label>
                      <textarea
                        value={activity.description}
                        onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                          Start Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={activity.startTime}
                          onChange={(e) => updateActivity(activity.id, 'startTime', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                          End Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={activity.endTime}
                          onChange={(e) => updateActivity(activity.id, 'endTime', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                          Location
                        </label>
                        <input
                          type="text"
                          value={activity.location}
                          onChange={(e) => updateActivity(activity.id, 'location', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEvent(null);
                  }}
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
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
