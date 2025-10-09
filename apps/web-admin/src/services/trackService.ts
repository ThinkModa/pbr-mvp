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
  created_at: string;
  updated_at: string;
  // Computed fields
  current_rsvps?: number;
  activities?: any[];
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
}

export interface UpdateTrackData {
  name?: string;
  description?: string;
  max_capacity?: number;
  display_order?: number;
  is_active?: boolean;
}

export class TrackService {
  // Get all tracks for an event
  static async getEventTracks(eventId: string): Promise<EventTrack[]> {
    const { data: tracks, error } = await supabase
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
    const { data: track, error } = await supabase
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
    const { data: trackActivities, error } = await supabase
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
    // Get current RSVPs for this track
    const { data: rsvps, error: rsvpError } = await supabase
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
    
    // First, get all activities for the event
    const { data: allActivities, error: allActivitiesError } = await supabase
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
    const { data: assignedActivities, error: assignedError } = await supabase
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
}
