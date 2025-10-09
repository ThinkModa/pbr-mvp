import React, { useState, useEffect } from 'react';
import { TrackService, EventTrack, CreateTrackData, UpdateTrackData } from '../services/trackService';
import { EventsService, EventWithActivities } from '../services/eventsService';

interface TrackManagementProps {
  event: EventWithActivities;
  onClose: () => void;
  onEventUpdated: () => void;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

const TrackManagement: React.FC<TrackManagementProps> = ({ event, onClose, onEventUpdated }) => {
  const [tracks, setTracks] = useState<EventTrack[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track form state
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<EventTrack | null>(null);
  const [trackFormData, setTrackFormData] = useState({
    name: '',
    description: '',
    max_capacity: '',
    display_order: 0,
  });

  // Activity assignment state
  const [selectedTrack, setSelectedTrack] = useState<EventTrack | null>(null);
  const [trackActivities, setTrackActivities] = useState<any[]>([]);

  useEffect(() => {
    if (event) {
      loadTracks();
      loadAvailableActivities();
    }
  }, [event]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const tracksData = await TrackService.getEventTracks(event.id);
      setTracks(tracksData);
    } catch (err) {
      console.error('Error loading tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableActivities = async () => {
    try {
      console.log('Loading available activities for event:', event.id, event.title);
      const activities = await TrackService.getAvailableActivities(event.id);
      console.log('Available activities loaded:', activities);
      setAvailableActivities(activities);
    } catch (err) {
      console.error('Error loading available activities:', err);
    }
  };

  const loadTrackActivities = async (trackId: string) => {
    try {
      const activities = await TrackService.getTrackActivities(trackId);
      setTrackActivities(activities);
    } catch (err) {
      console.error('Error loading track activities:', err);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const trackData: CreateTrackData = {
        event_id: event.id,
        name: trackFormData.name,
        description: trackFormData.description || undefined,
        max_capacity: trackFormData.max_capacity ? parseInt(trackFormData.max_capacity) : undefined,
        display_order: trackFormData.display_order,
      };

      await TrackService.createTrack(trackData);
      await loadTracks();
      setShowTrackForm(false);
      resetTrackForm();
    } catch (err) {
      console.error('Error creating track:', err);
      setError('Failed to create track');
    }
  };

  const handleUpdateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTrack) return;

    try {
      const trackData: UpdateTrackData = {
        name: trackFormData.name,
        description: trackFormData.description || undefined,
        max_capacity: trackFormData.max_capacity ? parseInt(trackFormData.max_capacity) : undefined,
        display_order: trackFormData.display_order,
      };

      await TrackService.updateTrack(editingTrack.id, trackData);
      await loadTracks();
      setShowTrackForm(false);
      setEditingTrack(null);
      resetTrackForm();
    } catch (err) {
      console.error('Error updating track:', err);
      setError('Failed to update track');
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      await TrackService.deleteTrack(trackId);
      await loadTracks();
    } catch (err) {
      console.error('Error deleting track:', err);
      setError('Failed to delete track');
    }
  };

  const handleAssignActivity = async (trackId: string, activityId: string) => {
    try {
      await TrackService.assignActivityToTrack(trackId, activityId);
      await loadTrackActivities(trackId);
      await loadAvailableActivities();
    } catch (err) {
      console.error('Error assigning activity:', err);
      setError('Failed to assign activity to track');
    }
  };

  const handleRemoveActivity = async (trackId: string, activityId: string) => {
    try {
      await TrackService.removeActivityFromTrack(trackId, activityId);
      await loadTrackActivities(trackId);
      await loadAvailableActivities();
    } catch (err) {
      console.error('Error removing activity:', err);
      setError('Failed to remove activity from track');
    }
  };

  const resetTrackForm = () => {
    setTrackFormData({
      name: '',
      description: '',
      max_capacity: '',
      display_order: 0,
    });
  };

  const openEditTrack = (track: EventTrack) => {
    setEditingTrack(track);
    setTrackFormData({
      name: track.name,
      description: track.description || '',
      max_capacity: track.max_capacity?.toString() || '',
      display_order: track.display_order,
    });
    setShowTrackForm(true);
  };

  const openNewTrack = () => {
    setEditingTrack(null);
    resetTrackForm();
    setShowTrackForm(true);
  };

  const openTrackActivities = (track: EventTrack) => {
    setSelectedTrack(track);
    loadTrackActivities(track.id);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading tracks...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
            Track Management
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
            {event.title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={openNewTrack}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create Track
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#F0F9FF',
        border: '1px solid #3B82F6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF', margin: '0 0 8px 0' }}>
          How Track Assignment Works
        </h3>
        <ol style={{ fontSize: '14px', color: '#1E40AF', margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '4px' }}>
            <strong>Create Tracks:</strong> Define different tracks (e.g., "Developer Track", "Design Track")
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>Assign Activities:</strong> Click "Manage Activities" on each track to assign specific activities
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>Track Selection:</strong> Attendees will choose a track when RSVPing, then see only activities for their selected track
          </li>
          <li>
            <strong>Unassigned Activities:</strong> Activities not assigned to any track will be visible to all attendees
          </li>
        </ol>
      </div>

      {/* Track Form Modal */}
      {showTrackForm && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              {editingTrack ? 'Edit Track' : 'Create New Track'}
            </h3>
            
            <form onSubmit={editingTrack ? handleUpdateTrack : handleCreateTrack}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Track Name *
                </label>
                <input
                  type="text"
                  value={trackFormData.name}
                  onChange={(e) => setTrackFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={trackFormData.description}
                  onChange={(e) => setTrackFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Max Capacity (optional)
                </label>
                <input
                  type="number"
                  value={trackFormData.max_capacity}
                  onChange={(e) => setTrackFormData(prev => ({ ...prev, max_capacity: e.target.value }))}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={trackFormData.display_order}
                  onChange={(e) => setTrackFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTrackForm(false);
                    setEditingTrack(null);
                    resetTrackForm();
                  }}
                  style={{
                    backgroundColor: '#6B7280',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
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
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {editingTrack ? 'Update Track' : 'Create Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Assignment Modal */}
      {selectedTrack && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Manage Activities for: {selectedTrack.name}
            </h3>

            {/* Assigned Activities */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
                Assigned Activities ({trackActivities.length})
              </h4>
              {trackActivities.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '14px' }}>No activities assigned to this track.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {trackActivities.map((ta) => (
                    <div key={ta.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>
                          {ta.activities?.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {ta.activities?.start_time} - {ta.activities?.end_time}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveActivity(selectedTrack.id, ta.activity_id)}
                        style={{
                          backgroundColor: '#DC2626',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Activities */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
                Available Activities ({availableActivities.length})
              </h4>
              {availableActivities.length === 0 ? (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>
                    No available activities to assign.
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', margin: 0 }}>
                    All activities for this event have been assigned to tracks, or no activities exist yet.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableActivities.map((activity) => (
                    <div key={activity.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#F0F9FF',
                      borderRadius: '6px',
                      border: '1px solid #BAE6FD',
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>
                          {activity.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {activity.start_time} - {activity.end_time}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignActivity(selectedTrack.id, activity.id)}
                        style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedTrack(null)}
                style={{
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            No tracks created yet
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            Create tracks to organize activities and require track selection for RSVPs.
          </p>
          <button
            onClick={openNewTrack}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create First Track
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {tracks.map((track) => (
            <div key={track.id} style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                    {track.name}
                  </h4>
                  {track.description && (
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 8px 0' }}>
                      {track.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
                    <span>Order: {track.display_order}</span>
                    {track.max_capacity && (
                      <span>Max Capacity: {track.max_capacity}</span>
                    )}
                    <span>Status: {track.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openTrackActivities(track)}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Manage Activities
                  </button>
                  <button
                    onClick={() => openEditTrack(track)}
                    style={{
                      backgroundColor: '#6B7280',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(track.id)}
                    style={{
                      backgroundColor: '#DC2626',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackManagement;
