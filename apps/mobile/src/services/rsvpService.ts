// RSVP service for managing event and activity RSVPs
// Uses centralized Supabase client for consistent database configuration
// Connects directly to live Supabase database

import { ProfileCompleteness } from './profileService';
import { supabase } from '../lib/supabase';

export type RSVPStatus = 'attending' | 'not_attending' | 'maybe' | 'waitlist' | 'pending';

export class ProfileIncompleteError extends Error {
  public readonly profileCompleteness: ProfileCompleteness;
  public readonly statusCode: number = 422;

  constructor(profileCompleteness: ProfileCompleteness) {
    super('Profile must be complete before RSVP');
    this.name = 'ProfileIncompleteError';
    this.profileCompleteness = profileCompleteness;
  }
}

export interface EventRSVP {
  id: string;
  user_id: string;
  event_id: string;
  status: RSVPStatus;
  track_id?: string;
  guest_count: number;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  notes?: string;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityRSVP {
  id: string;
  user_id: string;
  activity_id: string;
  status: RSVPStatus;
  guest_count: number;
  notes?: string;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RSVPStats {
  going: number;
  not_going: number;
  maybe: number;
  waitlist: number;
  total: number;
}

export class RSVPService {

  // Create a pending RSVP (for track selection)
  static async createPendingRSVP(eventId: string, userId: string): Promise<EventRSVP> {
    console.log('Creating pending RSVP:', { eventId, userId });
    
    // First, try to get existing RSVP
    const existingRSVP = await this.getUserEventRSVP(eventId, userId);
    
    if (existingRSVP) {
      // Update existing RSVP to pending
      return await this.updateEventRSVP(existingRSVP.id, 'pending');
    } else {
      // Create new pending RSVP
      const { data, error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'pending',
          guest_count: 1,
          is_approved: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pending RSVP:', error);
        throw new Error(`Failed to create pending RSVP: ${error.message}`);
      }
      
      console.log('✅ Pending RSVP created:', data.id);
      return data;
    }
  }

  // Create or update event RSVP (upsert)
  static async createEventRSVP(eventId: string, userId: string, status: RSVPStatus, trackId?: string): Promise<EventRSVP> {
    console.log('Creating/updating event RSVP:', { eventId, userId, status, trackId });
    
    // Note: Profile completeness check is now handled in MainApp before calling this method
    
    // First, try to get existing RSVP
    const existingRSVP = await this.getUserEventRSVP(eventId, userId);
    
    if (existingRSVP) {
      // Update existing RSVP
      return await this.updateEventRSVP(existingRSVP.id, status, trackId);
    } else {
      // Create new RSVP
      const rsvpData: any = {
        event_id: eventId,
        user_id: userId,
        status: status,
        guest_count: 1,
        is_approved: true,
      };
      
      // Add track_id if provided
      if (trackId) {
        rsvpData.track_id = trackId;
      }
      
      const { data, error } = await supabase
        .from('event_rsvps')
        .insert(rsvpData)
        .select()
        .single();

      if (error) {
        console.error('Error creating event RSVP:', error);
        throw new Error(`Failed to create event RSVP: ${error.message}`);
      }

      console.log('✅ Event RSVP created:', data.id);
      return data;
    }
  }

  // Confirm pending RSVP with track selection
  static async confirmPendingRSVP(eventId: string, userId: string, trackId: string): Promise<EventRSVP> {
    console.log('Confirming pending RSVP with track:', { eventId, userId, trackId });
    
    // Get existing pending RSVP
    const existingRSVP = await this.getUserEventRSVP(eventId, userId);
    
    if (!existingRSVP) {
      throw new Error('No pending RSVP found');
    }
    
    if (existingRSVP.status !== 'pending') {
      throw new Error('RSVP is not in pending status');
    }
    
    // Update to attending with track selection
    return await this.updateEventRSVP(existingRSVP.id, 'attending', trackId);
  }

  // Update existing event RSVP
  static async updateEventRSVP(rsvpId: string, status: RSVPStatus, trackId?: string): Promise<EventRSVP> {
    console.log('Updating event RSVP:', { rsvpId, status, trackId });
    
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString(),
    };
    
    // Add track_id if provided
    if (trackId) {
      updateData.track_id = trackId;
    }
    
    const { data, error } = await supabase
      .from('event_rsvps')
      .update(updateData)
      .eq('id', rsvpId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event RSVP:', error);
      throw new Error(`Failed to update event RSVP: ${error.message}`);
    }

    console.log('✅ Event RSVP updated:', data.id);
    return data;
  }

  // Delete event RSVP
  static async deleteEventRSVP(rsvpId: string): Promise<void> {
    console.log('Deleting event RSVP:', { rsvpId });
    
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('id', rsvpId);

    if (error) {
      console.error('Error deleting event RSVP:', error);
      throw new Error(`Failed to delete event RSVP: ${error.message}`);
    }

    console.log('✅ Event RSVP deleted');
  }

  // Get user's RSVP for a specific event
  static async getUserEventRSVP(eventId: string, userId: string): Promise<EventRSVP | null> {
    console.log('Getting user event RSVP:', { eventId, userId });
    
    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user event RSVP:', error);
      throw new Error(`Failed to get user event RSVP: ${error.message}`);
    }

    if (!rsvps || rsvps.length === 0) {
      console.log('✅ No user event RSVP found');
      return null;
    }
    
    console.log('✅ Retrieved user event RSVP:', rsvps[0]);
    return rsvps[0];
  }

  // Get all user's event RSVPs
  static async getUserEventRSVPs(userId: string): Promise<EventRSVP[]> {
    console.log('Getting user event RSVPs:', { userId });
    
    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user event RSVPs:', error);
      throw new Error(`Failed to get user event RSVPs: ${error.message}`);
    }
    console.log('✅ Retrieved user event RSVPs:', rsvps.length);
    return rsvps;
  }

  // Get RSVP statistics for an event
  static async getEventRSVPStats(eventId: string): Promise<RSVPStats> {
    console.log('Getting event RSVP stats:', { eventId });
    
    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error getting event RSVP stats:', error);
      throw new Error(`Failed to get event RSVP stats: ${error.message}`);
    }
    
    const stats: RSVPStats = {
      going: rsvps.filter((r: EventRSVP) => r.status === 'attending').length,
      not_going: rsvps.filter((r: EventRSVP) => r.status === 'not_attending').length,
      maybe: rsvps.filter((r: EventRSVP) => r.status === 'maybe').length,
      waitlist: rsvps.filter((r: EventRSVP) => r.status === 'waitlist').length,
      total: rsvps.length,
    };

    console.log('✅ Event RSVP stats:', stats);
    return stats;
  }

  // Create or update activity RSVP
  static async createActivityRSVP(activityId: string, userId: string, status: RSVPStatus): Promise<ActivityRSVP> {
    console.log('Creating activity RSVP:', { activityId, userId, status });
    
    const { data: rsvp, error } = await supabase
      .from('activity_rsvps')
      .insert({
        activity_id: activityId,
        user_id: userId,
        status: status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity RSVP:', error);
      throw new Error(`Failed to create activity RSVP: ${error.message}`);
    }
    console.log('✅ Activity RSVP created:', rsvp);
    return rsvp;
  }

  // Get user's RSVP for a specific activity
  static async getUserActivityRSVP(activityId: string, userId: string): Promise<ActivityRSVP | null> {
    console.log('Getting user activity RSVP:', { activityId, userId });
    
    const { data: rsvps, error } = await supabase
      .from('activity_rsvps')
      .select('*')
      .eq('activity_id', activityId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user activity RSVP:', error);
      throw new Error(`Failed to get user activity RSVP: ${error.message}`);
    }

    return rsvps && rsvps.length > 0 ? rsvps[0] : null;
  }


  // Delete activity RSVP
  static async deleteActivityRSVP(rsvpId: string): Promise<void> {
    console.log('Deleting activity RSVP:', { rsvpId });
    
    const { error } = await supabase
      .from('activity_rsvps')
      .delete()
      .eq('id', rsvpId);

    if (error) {
      console.error('Error deleting activity RSVP:', error);
      throw new Error(`Failed to delete activity RSVP: ${error.message}`);
    }

    console.log('✅ Activity RSVP deleted');
  }

  // Get all RSVPs for a specific activity
  static async getActivityRSVPs(activityId: string): Promise<ActivityRSVP[]> {
    console.log('Getting activity RSVPs:', { activityId });
    
    const { data: rsvps, error } = await supabase
      .from('activity_rsvps')
      .select('*')
      .eq('activity_id', activityId);

    if (error) {
      console.error('Error getting activity RSVPs:', error);
      throw new Error(`Failed to get activity RSVPs: ${error.message}`);
    }

    console.log('✅ Retrieved activity RSVPs:', rsvps.length);
    return rsvps || [];
  }
}