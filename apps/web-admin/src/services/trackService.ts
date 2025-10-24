// Track service for web admin track management
import { supabase, getServiceRoleClient } from '../lib/supabase';

export interface EventTrack {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  max_capacity?: number;
  display_order: number;
  is_active: boolean;
  track_group_id?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  current_rsvps?: number;
  activities?: any[];
  track_group?: TrackGroup;
}

export interface TrackGroup {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  is_mutually_exclusive: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackActivity {
  id: string;
  track_id: string;
  activity_id: string;
  created_at: string;
}

export interface CreateTrackData {
  event_id: string;
  name: string;
  description?: string;
  max_capacity?: number;
  display_order?: number;
  track_group_id?: string;
}

export interface CreateTrackGroupData {
  event_id: string;
  name: string;
  description?: string;
  is_mutually_exclusive?: boolean;
  trackIds?: string[];
}

export interface UpdateTrackData {
  name?: string;
  description?: string;
  max_capacity?: number;
  display_order?: number;
  is_active?: boolean;
  track_group_id?: string;
}

export class TrackService {
  // Get all tracks for an event
  static async getEventTracks(eventId: string): Promise<EventTrack[]> {
    const serviceClient = getServiceRoleClient();
    const { data: tracks, error } = await serviceClient
      .from('event_tracks')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching event tracks:', error);
      throw error;
    }

    return tracks || [];
  }

  // Get a single track by ID
  static async getTrack(trackId: string): Promise<EventTrack> {
    const serviceClient = getServiceRoleClient();
    const { data: track, error } = await serviceClient
      .from('event_tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (error) {
      console.error('Error fetching track:', error);
      throw error;
    }

    return track;
  }

  // Create a new track
  static async createTrack(trackData: CreateTrackData): Promise<EventTrack> {
    const serviceClient = getServiceRoleClient();
    
    const { data: track, error } = await serviceClient
      .from('event_tracks')
      .insert({
        event_id: trackData.event_id,
        name: trackData.name,
        description: trackData.description,
        max_capacity: trackData.max_capacity,
        display_order: trackData.display_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating track:', error);
      throw error;
    }

    return track;
  }

  // Update an existing track
  static async updateTrack(trackId: string, trackData: UpdateTrackData): Promise<EventTrack> {
    const serviceClient = getServiceRoleClient();
    
    const { data: track, error } = await serviceClient
      .from('event_tracks')
      .update({
        ...trackData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackId)
      .select()
      .single();

    if (error) {
      console.error('Error updating track:', error);
      throw error;
    }

    return track;
  }

  // Delete a track
  static async deleteTrack(trackId: string): Promise<void> {
    const serviceClient = getServiceRoleClient();
    
    const { error } = await serviceClient
      .from('event_tracks')
      .delete()
      .eq('id', trackId);

    if (error) {
      console.error('Error deleting track:', error);
      throw error;
    }
  }

  // Get activities assigned to a track
  static async getTrackActivities(trackId: string): Promise<any[]> {
    const serviceClient = getServiceRoleClient();
    const { data: trackActivities, error } = await serviceClient
      .from('track_activities')
      .select(`
        *,
        activities (
          id,
          title,
          description,
          start_time,
          end_time
        )
      `)
      .eq('track_id', trackId);

    if (error) {
      console.error('Error fetching track activities:', error);
      throw error;
    }

    return trackActivities || [];
  }

  // Assign an activity to a track
  static async assignActivityToTrack(trackId: string, activityId: string): Promise<TrackActivity> {
    const serviceClient = getServiceRoleClient();
    
    const { data: trackActivity, error } = await serviceClient
      .from('track_activities')
      .insert({
        track_id: trackId,
        activity_id: activityId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning activity to track:', error);
      throw error;
    }

    return trackActivity;
  }

  // Remove an activity from a track
  static async removeActivityFromTrack(trackId: string, activityId: string): Promise<void> {
    const serviceClient = getServiceRoleClient();
    
    const { error } = await serviceClient
      .from('track_activities')
      .delete()
      .eq('track_id', trackId)
      .eq('activity_id', activityId);

    if (error) {
      console.error('Error removing activity from track:', error);
      throw error;
    }
  }

  // Get track capacity information
  static async getTrackCapacity(trackId: string): Promise<{ current_rsvps: number; max_capacity?: number }> {
    const serviceClient = getServiceRoleClient();
    // Get current RSVPs for this track
    const { data: rsvps, error: rsvpError } = await serviceClient
      .from('event_rsvps')
      .select('id')
      .eq('track_id', trackId)
      .eq('status', 'attending');

    if (rsvpError) {
      console.error('Error fetching track RSVPs:', rsvpError);
      throw rsvpError;
    }

    const current_rsvps = rsvps?.length || 0;

    // Get track max capacity
    const track = await this.getTrack(trackId);
    
    return {
      current_rsvps,
      max_capacity: track.max_capacity
    };
  }

  // Get available activities for an event (not assigned to any track)
  static async getAvailableActivities(eventId: string): Promise<any[]> {
    console.log('TrackService.getAvailableActivities called with eventId:', eventId);
    const serviceClient = getServiceRoleClient();
    
    // First, get all activities for the event
    const { data: allActivities, error: allActivitiesError } = await serviceClient
      .from('activities')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time
      `)
      .eq('event_id', eventId);

    if (allActivitiesError) {
      console.error('Error fetching all activities:', allActivitiesError);
      throw allActivitiesError;
    }

    console.log('All activities for event:', allActivities);

    // Then, get all assigned activity IDs
    const { data: assignedActivities, error: assignedError } = await serviceClient
      .from('track_activities')
      .select('activity_id')
      .not('activity_id', 'is', null);

    if (assignedError) {
      console.error('Error fetching assigned activities:', assignedError);
      throw assignedError;
    }

    console.log('Assigned activities:', assignedActivities);

    // Filter out assigned activities
    const assignedIds = new Set(assignedActivities?.map(ta => ta.activity_id) || []);
    const availableActivities = allActivities?.filter(activity => !assignedIds.has(activity.id)) || [];

    console.log('Available activities after filtering:', availableActivities);

    return availableActivities;
  }

  // Track Group Methods

  // Create a track group
  static async createTrackGroup(groupData: CreateTrackGroupData): Promise<TrackGroup> {
    const serviceClient = getServiceRoleClient();
    
    // Create the group
    const { data: group, error: groupError } = await serviceClient
      .from('track_groups')
      .insert({
        event_id: groupData.event_id,
        name: groupData.name,
        description: groupData.description,
        is_mutually_exclusive: groupData.is_mutually_exclusive ?? true,
      })
      .select()
      .single();
    
    if (groupError) {
      console.error('Error creating track group:', groupError);
      throw groupError;
    }
    
    // Assign tracks to group if provided
    if (groupData.trackIds && groupData.trackIds.length > 0) {
      const { error: updateError } = await serviceClient
        .from('event_tracks')
        .update({ track_group_id: group.id })
        .in('id', groupData.trackIds);
      
      if (updateError) {
        console.error('Error assigning tracks to group:', updateError);
        throw updateError;
      }
    }
    
    return group;
  }

  // Get track groups for an event
  static async getTrackGroups(eventId: string): Promise<TrackGroup[]> {
    const serviceClient = getServiceRoleClient();
    
    const { data, error } = await serviceClient
      .from('track_groups')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching track groups:', error);
      throw error;
    }
    
    return data || [];
  }

  // Update a track group
  static async updateTrackGroup(groupId: string, updates: Partial<TrackGroup>): Promise<void> {
    const serviceClient = getServiceRoleClient();
    
    const { error } = await serviceClient
      .from('track_groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId);
    
    if (error) {
      console.error('Error updating track group:', error);
      throw error;
    }
  }

  // Delete a track group
  static async deleteTrackGroup(groupId: string): Promise<void> {
    const serviceClient = getServiceRoleClient();
    
    // Remove track_group_id from tracks first
    await serviceClient
      .from('event_tracks')
      .update({ track_group_id: null })
      .eq('track_group_id', groupId);
    
    // Delete the group
    const { error } = await serviceClient
      .from('track_groups')
      .delete()
      .eq('id', groupId);
    
    if (error) {
      console.error('Error deleting track group:', error);
      throw error;
    }
  }

  // Get tracks with their groups
  static async getEventTracksWithGroups(eventId: string): Promise<EventTrack[]> {
    const serviceClient = getServiceRoleClient();
    const { data: tracks, error } = await serviceClient
      .from('event_tracks')
      .select(`
        *,
        track_group:track_groups(*)
      `)
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching event tracks with groups:', error);
      throw error;
    }

    return tracks || [];
  }
}
