import React, { useState, useEffect, useRef } from 'react';
import { Speaker, CreateSpeakerData, UpdateSpeakerData, SpeakersService } from '../services/speakersService';
import { EventsService } from '../services/eventsService';
import { ImageUploadService } from '../services/imageUploadService';

interface SpeakerFormProps {
  speaker?: Speaker;
  onSubmit: (data: CreateSpeakerData | UpdateSpeakerData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const SpeakerForm: React.FC<SpeakerFormProps> = ({ speaker, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    company: '',
    bio: '',
    expertise: [] as string[],
    profileImageUrl: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      website: '',
      github: '',
    },
    isPublic: true,
    allowContact: true,
    tags: [] as string[],
  });

  const [expertiseInput, setExpertiseInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // Event assignment state
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [assignedEvents, setAssignedEvents] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Activity assignment state
  const [assignedActivities, setAssignedActivities] = useState<string[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (speaker) {
      setFormData({
        firstName: speaker.firstName,
        lastName: speaker.lastName,
        email: speaker.email,
        phone: speaker.phone || '',
        title: speaker.title || '',
        company: speaker.company || '',
        bio: speaker.bio || '',
        expertise: speaker.expertise || [],
        profileImageUrl: speaker.profileImageUrl || '',
        socialLinks: {
          linkedin: speaker.socialLinks?.linkedin || '',
          twitter: speaker.socialLinks?.twitter || '',
          website: speaker.socialLinks?.website || '',
          github: speaker.socialLinks?.github || '',
        },
        isPublic: speaker.isPublic,
        allowContact: speaker.allowContact,
        tags: speaker.tags || [],
      });
      setExpertiseInput(speaker.expertise?.join(', ') || '');
      setTagsInput(speaker.tags?.join(', ') || '');
    }
  }, [speaker]);

  // Load upcoming events and assigned events
  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const events = await EventsService.getUpcomingEvents();
        setUpcomingEvents(events);
        
        if (speaker) {
          const assigned = await EventsService.getSpeakerEvents(speaker.id);
          setAssignedEvents(assigned);
          
          // Load assigned activities
          const activities = await SpeakersService.getSpeakerActivities(speaker.id);
          setAssignedActivities(activities);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [speaker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const handleExpertiseChange = (value: string) => {
    setExpertiseInput(value);
    const expertise = value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, expertise }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleEventAssignment = async (eventId: string, isAssigned: boolean) => {
    if (!speaker) return; // Can't assign events to new speakers until they're created
    
    try {
      if (isAssigned) {
        await EventsService.assignSpeakerToEvent(speaker.id, eventId);
        setAssignedEvents(prev => [...prev, eventId]);
      } else {
        await EventsService.unassignSpeakerFromEvent(speaker.id, eventId);
        setAssignedEvents(prev => prev.filter(id => id !== eventId));
        // Also remove from activities when unassigned from event
        await loadSpeakerActivities();
      }
      
      // Reload activities when event assignments change
      await loadUpcomingActivities();
    } catch (error) {
      console.error('Error updating event assignment:', error);
      // You might want to show an error message to the user here
    }
  };

  const loadSpeakerActivities = async () => {
    if (!speaker) return;
    
    try {
      setLoadingActivities(true);
      const activityIds = await SpeakersService.getSpeakerActivities(speaker.id);
      setAssignedActivities(activityIds);
      
      // Load upcoming activities from assigned events
      await loadUpcomingActivities();
    } catch (error) {
      console.error('Error loading speaker activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadUpcomingActivities = async () => {
    if (!speaker || assignedEvents.length === 0) return;
    
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
    if (!speaker) return;
    
    try {
      if (isAssigned) {
        await SpeakersService.assignSpeakerToActivity(speaker.id, activityId);
        setAssignedActivities(prev => [...prev, activityId]);
      } else {
        await SpeakersService.unassignSpeakerFromActivity(speaker.id, activityId);
        setAssignedActivities(prev => prev.filter(id => id !== activityId));
      }
    } catch (error) {
      console.error('Error updating activity assignment:', error);
    }
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
      const imageUrl = await ImageUploadService.uploadImage(file, 'speakers');
      setFormData(prev => ({ ...prev, profileImageUrl: imageUrl }));
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
    setFormData(prev => ({ ...prev, profileImageUrl: '' }));
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      ...(speaker && { id: speaker.id })
    };
    
    console.log('Submitting speaker data:', submitData);
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
        {speaker ? 'Edit Speaker' : 'Create New Speaker'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <label htmlFor="firstName" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>

          <div>
            <label htmlFor="lastName" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <label htmlFor="title" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Title/Position
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Senior Software Engineer"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            />
          </div>

          <div>
            <label htmlFor="company" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="e.g., TechCorp"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            placeholder="Tell us about the speaker's background and expertise..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          />
        </div>

        {/* Expertise */}
        <div>
          <label htmlFor="expertise" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Expertise
          </label>
          <input
            type="text"
            id="expertise"
            value={expertiseInput}
            onChange={(e) => handleExpertiseChange(e.target.value)}
            placeholder="React, Node.js, AI, Machine Learning (comma-separated)"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          />
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>Separate multiple skills with commas</p>
        </div>

        {/* Profile Image */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Profile Image
          </label>
          
          {/* Current Image Display */}
          {(formData.profileImageUrl || imagePreview) && (
            <div style={{ marginBottom: '12px' }}>
              <img
                src={imagePreview || formData.profileImageUrl}
                alt="Profile preview"
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
              {uploadingImage ? 'Uploading...' : 'Choose Image'}
            </button>
            
            {(formData.profileImageUrl || imagePreview) && (
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
            <label htmlFor="profileImageUrl" style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#6b7280', marginBottom: '4px' }}>
              Or enter image URL manually:
            </label>
            <input
              type="text"
              id="profileImageUrl"
              name="profileImageUrl"
              value={formData.profileImageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/profile.jpg"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            />
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Social Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="linkedin" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                LinkedIn
              </label>
              <input
                type="text"
                id="linkedin"
                value={formData.socialLinks.linkedin}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="twitter" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Twitter
              </label>
              <input
                type="text"
                id="twitter"
                value={formData.socialLinks.twitter}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                placeholder="https://twitter.com/username"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>

            <div>
              <label htmlFor="github" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                GitHub
              </label>
              <input
                type="text"
                id="github"
                value={formData.socialLinks.github}
                onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                placeholder="https://github.com/username"
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
                value={formData.socialLinks.website}
                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                placeholder="https://example.com"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </div>
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
            placeholder="speaker, tech, leadership (comma-separated)"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          />
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>Separate multiple tags with commas</p>
        </div>

        {/* Event Assignment */}
        {speaker && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827' }}>Event Assignment</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Select which upcoming events this speaker should be assigned to:
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
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  No upcoming events found.
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
        {speaker && assignedEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827' }}>Activity Assignment</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Select which activities this speaker should be assigned to within their assigned events:
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827' }}>Settings</h3>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              style={{ height: '16px', width: '16px', color: '#2563eb', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <label htmlFor="isPublic" style={{ marginLeft: '8px', display: 'block', fontSize: '14px', color: '#111827' }}>
              Make speaker profile public
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="allowContact"
              name="allowContact"
              checked={formData.allowContact}
              onChange={handleInputChange}
              style={{ height: '16px', width: '16px', color: '#2563eb', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <label htmlFor="allowContact" style={{ marginLeft: '8px', display: 'block', fontSize: '14px', color: '#111827' }}>
              Allow contact from attendees
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: 'white', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '8px 16px', border: '1px solid transparent', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: 'white', backgroundColor: '#3B82F6', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', opacity: isLoading ? 0.5 : 1 }}
          >
            {isLoading ? 'Saving...' : (speaker ? 'Update Speaker' : 'Create Speaker')}
          </button>
        </div>
      </form>

    </div>
  );
};

export default SpeakerForm;
