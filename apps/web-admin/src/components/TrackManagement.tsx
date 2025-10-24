import React, { useState, useEffect } from 'react';
import { TrackService, EventTrack, CreateTrackData, UpdateTrackData, TrackGroup, CreateTrackGroupData } from '../services/trackService';
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

// Helper function to format date and time in friendly format
const formatFriendlyDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const formatted = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${formatted} at ${time}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const TrackManagement: React.FC<TrackManagementProps> = ({ event, onClose, onEventUpdated }) => {
  const [tracks, setTracks] = useState<EventTrack[]>([]);
  const [trackGroups, setTrackGroups] = useState<TrackGroup[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackActivityCounts, setTrackActivityCounts] = useState<Record<string, number>>({});
  
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

  // Track group state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedGroupTracks, setSelectedGroupTracks] = useState<string[]>([]);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    is_mutually_exclusive: true,
  });

  useEffect(() => {
    if (event) {
      loadTracks();
      loadTrackGroups();
      loadAvailableActivities();
    }
  }, [event]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const tracksData = await TrackService.getEventTracks(event.id);
      setTracks(tracksData);
      
      // Load activity counts for each track
      const counts: Record<string, number> = {};
      for (const track of tracksData) {
        try {
          const activities = await TrackService.getTrackActivities(track.id);
          counts[track.id] = activities.length;
        } catch (err) {
          console.error(`Error loading activities for track ${track.id}:`, err);
          counts[track.id] = 0;
        }
      }
      setTrackActivityCounts(counts);
    } catch (err) {
      console.error('Error loading tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackGroups = async () => {
    try {
      const groups = await TrackService.getTrackGroups(event.id);
      setTrackGroups(groups);
    } catch (err) {
      console.error('Error loading track groups:', err);
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
      
      // Update activity count for this track
      setTrackActivityCounts(prev => ({
        ...prev,
        [trackId]: (prev[trackId] || 0) + 1
      }));
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
      
      // Update activity count for this track
      setTrackActivityCounts(prev => ({
        ...prev,
        [trackId]: Math.max(0, (prev[trackId] || 0) - 1)
      }));
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

  // Track Group Management Functions
  const handleCreateTrackGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const groupData: CreateTrackGroupData = {
        event_id: event.id,
        name: groupFormData.name,
        description: groupFormData.description || undefined,
        is_mutually_exclusive: groupFormData.is_mutually_exclusive,
        trackIds: selectedGroupTracks,
      };

      await TrackService.createTrackGroup(groupData);
      await loadTrackGroups();
      await loadTracks(); // Reload tracks to get updated group assignments
      setShowCreateGroupModal(false);
      resetGroupForm();
    } catch (err) {
      console.error('Error creating track group:', err);
      setError('Failed to create track group');
    }
  };

  const handleDeleteTrackGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this track group? This will remove all tracks from the group but keep the tracks themselves.')) {
      return;
    }

    try {
      await TrackService.deleteTrackGroup(groupId);
      await loadTrackGroups();
      await loadTracks(); // Reload tracks to get updated group assignments
    } catch (err) {
      console.error('Error deleting track group:', err);
      setError('Failed to delete track group');
    }
  };

  const resetGroupForm = () => {
    setGroupFormData({
      name: '',
      description: '',
      is_mutually_exclusive: true,
    });
    setSelectedGroupTracks([]);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading tracks...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#F9FAFB'
    }}>
      {/* Fixed Header */}
      <div style={{ 
        flexShrink: 0,
        padding: '20px 20px 0 20px',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB'
      }}>
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
              onClick={() => setShowCreateGroupModal(true)}
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Create Track Group
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '0 20px 20px 20px'
      }}>
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
              <strong>Create Track Groups:</strong> Group tracks together for mutually exclusive selection (e.g., "Morning Workshops" where users pick one)
            </li>
            <li style={{ marginBottom: '4px' }}>
              <strong>Assign Activities:</strong> Click "Manage Activities" on each track to assign specific activities
            </li>
            <li style={{ marginBottom: '4px' }}>
              <strong>Track Selection:</strong> Attendees will choose tracks when RSVPing, with mutual exclusivity enforced for grouped tracks
            </li>
            <li>
              <strong>Unassigned Activities:</strong> Activities not assigned to any track will be visible to all attendees
            </li>
          </ol>
        </div>

        {/* Track Groups Section */}
        {trackGroups.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Track Groups
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {trackGroups.map(group => {
                const groupTracks = tracks.filter(t => t.track_group_id === group.id);
                
                return (
                  <div key={group.id} style={{
                    border: '2px solid #3B82F6',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#EFF6FF'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>
                          {group.name}
                        </div>
                        {group.is_mutually_exclusive && (
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#DC2626',
                            marginTop: '4px'
                          }}>
                            ⚠️ Mutually Exclusive (Choose 1)
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDeleteTrackGroup(group.id)}
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
                          Delete Group
                        </button>
                      </div>
                    </div>
                    
                    {group.description && (
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                        {group.description}
                      </div>
                    )}
                    
                    <div style={{ paddingLeft: '16px' }}>
                      {groupTracks.map(track => (
                        <div key={track.id} style={{ 
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>
                              {track.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              Activities: {trackActivityCounts[track.id] || 0}
                            </div>
                          </div>
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
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Independent Tracks Section */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Independent Tracks
          </h3>

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
                          {formatFriendlyDateTime(ta.activities?.start_time)} - {formatFriendlyDateTime(ta.activities?.end_time)}
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
                          {formatFriendlyDateTime(activity.start_time)} - {formatFriendlyDateTime(activity.end_time)}
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

      {/* Create Track Group Modal */}
      {showCreateGroupModal && (
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
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Create Track Group
            </h3>
            
            <form onSubmit={handleCreateTrackGroup}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., Morning Workshops"
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
                  Description (optional)
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="e.g., Choose one workshop to attend"
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={groupFormData.is_mutually_exclusive}
                    onChange={(e) => setGroupFormData(prev => ({ ...prev, is_mutually_exclusive: e.target.checked }))}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Mutually Exclusive (users can only select ONE track from this group)
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Select Tracks to Include:
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '8px',
                }}>
                  {tracks.filter(t => !t.track_group_id).map(track => (
                    <div key={track.id} style={{ padding: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedGroupTracks.includes(track.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupTracks([...selectedGroupTracks, track.id]);
                            } else {
                              setSelectedGroupTracks(selectedGroupTracks.filter(id => id !== track.id));
                            }
                          }}
                        />
                        <span style={{ fontSize: '14px' }}>
                          {track.name} (Activities: {trackActivityCounts[track.id] || 0})
                        </span>
                      </label>
                    </div>
                  ))}
                  {tracks.filter(t => !t.track_group_id).length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                      No independent tracks available to group.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroupModal(false);
                    resetGroupForm();
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
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* Independent Tracks List */}
          {tracks.filter(t => !t.track_group_id).length === 0 ? (
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
            {tracks.filter(t => !t.track_group_id).map((track) => (
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
                    <span>Activities: {trackActivityCounts[track.id] || 0}</span>
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
      </div>

      {/* Sticky Footer */}
      <div style={{
        flexShrink: 0,
        padding: '20px',
        backgroundColor: 'white',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
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
        <button
          onClick={() => {
            // Save any pending changes and close
            onEventUpdated();
            onClose();
          }}
          style={{
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default TrackManagement;
