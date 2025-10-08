import React, { useState, useEffect, useRef } from 'react';
import { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationsService } from '../services/organizationsService';
import { EventsService } from '../services/eventsService';
import { ImageUploadService } from '../services/imageUploadService';

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationData | UpdateOrganizationData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ organization, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    industry: '',
    size: '',
    foundedYear: '',
    isPublic: true,
    allowContact: true,
    isSponsor: false,
    tags: [] as string[],
  });

  const [tagsInput, setTagsInput] = useState('');
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event assignment state
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [assignedEvents, setAssignedEvents] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Activity assignment state
  const [assignedActivities, setAssignedActivities] = useState<string[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        description: organization.description || '',
        website: organization.website || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        logoUrl: organization.logoUrl || '',
        industry: organization.industry || '',
        size: organization.size || '',
        foundedYear: organization.foundedYear?.toString() || '',
        isPublic: organization.isPublic,
        allowContact: organization.allowContact,
        isSponsor: organization.isSponsor,
        tags: organization.tags || [],
      });
      setTagsInput(organization.tags.join(', '));
    }
  }, [organization]);

  // Load upcoming events and assigned events when editing an organization
  useEffect(() => {
    if (organization) {
      loadEventsAndAssignments();
    }
  }, [organization]);

  const loadEventsAndAssignments = async () => {
    if (!organization) return;
    
    try {
      setLoadingEvents(true);
      
      // Load upcoming events, assigned events, and assigned activities in parallel
      const [events, assignedEventIds, assignedActivityIds] = await Promise.all([
        EventsService.getUpcomingEvents(),
        OrganizationsService.getOrganizationEvents(organization.id),
        OrganizationsService.getOrganizationActivities(organization.id)
      ]);
      
      setUpcomingEvents(events);
      setAssignedEvents(assignedEventIds);
      setAssignedActivities(assignedActivityIds);
    } catch (error) {
      console.error('Error loading events and assignments:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      const imageUrl = await ImageUploadService.uploadImage(file, 'organizations');
      setFormData(prev => ({ ...prev, logoUrl: imageUrl }));
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
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEventAssignment = async (eventId: string, isAssigned: boolean) => {
    if (!organization) return;
    
    try {
      if (isAssigned) {
        // Assign organization to event
        await OrganizationsService.assignOrganizationToEvent(organization.id, eventId);
        setAssignedEvents(prev => [...prev, eventId]);
      } else {
        // Unassign organization from event
        await OrganizationsService.unassignOrganizationFromEvent(organization.id, eventId);
        setAssignedEvents(prev => prev.filter(id => id !== eventId));
        // Also remove from activities when unassigned from event
        await loadOrganizationActivities();
      }
      
      // Reload activities when event assignments change
      await loadUpcomingActivities();
    } catch (error) {
      console.error('Error updating event assignment:', error);
      alert('Failed to update event assignment. Please try again.');
    }
  };

  const loadOrganizationActivities = async () => {
    if (!organization) return;
    
    try {
      setLoadingActivities(true);
      const activityIds = await OrganizationsService.getOrganizationActivities(organization.id);
      setAssignedActivities(activityIds);
      
      // Load upcoming activities from assigned events
      await loadUpcomingActivities();
    } catch (error) {
      console.error('Error loading organization activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadUpcomingActivities = async () => {
    if (!organization || assignedEvents.length === 0) return;
    
    try {
      const eventsData = await EventsService.getEvents();
      const assignedEventsData = eventsData.filter(event => 
        assignedEvents.includes(event.id)
      );
      
      // Flatten all activities from assigned events
      const allActivities = assignedEventsData.flatMap(event => 
        event.activities.map(activity => ({
          ...activity,
          eventName: event.name
        }))
      );
      
      setUpcomingActivities(allActivities);
    } catch (error) {
      console.error('Error loading upcoming activities:', error);
    }
  };

  const handleActivityAssignment = async (activityId: string, isAssigned: boolean) => {
    if (!organization) return;
    
    try {
      if (isAssigned) {
        await OrganizationsService.assignOrganizationToActivity(organization.id, activityId);
        setAssignedActivities(prev => [...prev, activityId]);
      } else {
        await OrganizationsService.unassignOrganizationFromActivity(organization.id, activityId);
        setAssignedActivities(prev => prev.filter(id => id !== activityId));
      }
    } catch (error) {
      console.error('Error updating activity assignment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
      ...(organization && { id: organization.id })
    };
    
    console.log('Submitting organization data:', submitData);
    await onSubmit(submitData);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '24px'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '24px'
      }}>
        {organization ? 'Edit Organization' : 'Create New Organization'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic Information */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Organization Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="industry" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Industry
              </label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g., Technology, Healthcare, Finance"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="size" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Company Size
              </label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              >
                <option value="">Select size</option>
                <option value="startup">Startup (1-10)</option>
                <option value="small">Small (11-50)</option>
                <option value="medium">Medium (51-200)</option>
                <option value="large">Large (201-1000)</option>
                <option value="enterprise">Enterprise (1000+)</option>
              </select>
            </div>

            <div>
              <label htmlFor="foundedYear" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Founded Year
              </label>
              <input
                type="number"
                id="foundedYear"
                name="foundedYear"
                value={formData.foundedYear}
                onChange={handleInputChange}
                min="1800"
                max={new Date().getFullYear()}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label htmlFor="description" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Brief description of the organization..."
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Contact Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="website" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Website
              </label>
              <input
                type="text"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="address" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>
          </div>
        </div>


        {/* Logo Upload */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Organization Logo
          </label>
          
          {/* Current Logo Display */}
          {(formData.logoUrl || imagePreview) && (
            <div style={{ marginBottom: '12px' }}>
              <img
                src={imagePreview || formData.logoUrl}
                alt="Logo preview"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb'
                }}
              />
            </div>
          )}
          
          {/* File Upload */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              style={{
                padding: '8px 16px',
                backgroundColor: uploadingImage ? '#9ca3af' : '#2563eb',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'white',
                cursor: uploadingImage ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadingImage ? 'Uploading...' : 'Choose Logo'}
            </button>
            
            {(formData.logoUrl || imagePreview) && (
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            )}
          </div>
          
          {/* Manual URL Input (fallback) */}
          <div style={{ marginTop: '12px' }}>
            <label htmlFor="logoUrl" style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#6b7280', marginBottom: '4px' }}>
              Or enter logo URL manually:
            </label>
            <input
              type="text"
              id="logoUrl"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Tags
          </label>
          <input
            type="text"
            id="tags"
            value={tagsInput}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="tag1, tag2, tag3"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          />
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>Separate multiple tags with commas</p>
        </div>

        {/* Event Assignment */}
        {organization && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827' }}>Event Assignment</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Select which upcoming events this organization should be assigned to:
            </p>
            
            {loadingEvents ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '24px' 
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
                  Loading events...
                </span>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                  No upcoming events available for assignment.
                </p>
              </div>
            ) : (
              <div style={{ 
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px'
              }}>
                {upcomingEvents.map((event) => {
                  const isAssigned = assignedEvents.includes(event.id);
                  const eventDate = new Date(event.start_time).toLocaleDateString();
                  
                  return (
                    <div key={event.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '8px',
                      backgroundColor: isAssigned ? '#f0f9ff' : 'transparent',
                      borderRadius: '4px',
                      border: isAssigned ? '1px solid #bae6fd' : '1px solid transparent'
                    }}>
                      <input
                        type="checkbox"
                        id={`event-${event.id}`}
                        checked={isAssigned}
                        onChange={(e) => handleEventAssignment(event.id, e.target.checked)}
                        style={{ 
                          height: '16px', 
                          width: '16px', 
                          color: '#2563eb', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '4px' 
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <label 
                          htmlFor={`event-${event.id}`}
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#111827',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                        >
                          {event.title}
                        </label>
                        <p style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: '2px 0 0 0'
                        }}>
                          {eventDate} • {event.location?.name || 'Location TBD'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity Assignment */}
        {organization && assignedEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827' }}>Activity Assignment</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Select which activities this organization should be assigned to within their assigned events:
            </p>
            
            {loadingActivities ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '24px' 
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
                  Loading activities...
                </span>
              </div>
            ) : upcomingActivities.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  No activities found for assigned events.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px'
              }}>
                {upcomingActivities.map((activity) => {
                  const isAssigned = assignedActivities.includes(activity.id);
                  const activityDate = new Date(activity.start_time).toLocaleDateString();
                  const activityTime = `${new Date(activity.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - ${new Date(activity.end_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}`;
                  
                  return (
                    <div key={activity.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '8px',
                      backgroundColor: isAssigned ? '#f0f9ff' : 'transparent',
                      borderRadius: '4px',
                      border: isAssigned ? '1px solid #bae6fd' : '1px solid transparent'
                    }}>
                      <input
                        type="checkbox"
                        id={`activity-${activity.id}`}
                        checked={isAssigned}
                        onChange={(e) => handleActivityAssignment(activity.id, e.target.checked)}
                        style={{ 
                          height: '16px', 
                          width: '16px', 
                          color: '#2563eb', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '4px' 
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <label 
                          htmlFor={`activity-${activity.id}`}
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#111827',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                        >
                          {activity.title}
                        </label>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          margin: '2px 0 0 0' 
                        }}>
                          {activityDate} • {activityTime} • {activity.eventName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Make organization public</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="allowContact"
                checked={formData.allowContact}
                onChange={handleInputChange}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Allow contact from users</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="isSponsor"
                checked={formData.isSponsor}
                onChange={handleInputChange}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Mark as sponsor</span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Saving...' : (organization ? 'Update Organization' : 'Create Organization')}
          </button>
        </div>
      </form>

    </div>
  );
};

export default OrganizationForm;
