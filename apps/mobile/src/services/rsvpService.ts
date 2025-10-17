// RSVP service for managing event and activity RSVPs
// Uses REST API calls to avoid Supabase client compatibility issues with Expo Go
// Connects directly to live Supabase database

import { ProfileCompleteness } from './profileService';

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
  // Use the network IP address that Expo Go can reach
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  // Get RSVP headers for API calls
  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

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
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_rsvps`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId,
          status: 'pending',
          guest_count: 1,
          is_approved: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating pending RSVP:', errorText);
        throw new Error(`Failed to create pending RSVP: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!responseText.trim()) {
        console.log('✅ Pending RSVP created (empty response)');
        return { id: 'created', event_id: eventId, user_id: userId, status: 'pending' };
      }
      
      const rsvp = JSON.parse(responseText);
      console.log('✅ Pending RSVP created:', rsvp);
      return rsvp;
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
      
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_rsvps`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(rsvpData),
      });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating event RSVP:', errorText);
      throw new Error(`Failed to create event RSVP: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (!responseText.trim()) {
      // Empty response - this is actually success for some operations
      console.log('✅ Event RSVP created (empty response)');
      return { id: 'created', event_id: eventId, user_id: userId, status };
    }
    
    const rsvp = JSON.parse(responseText);
    console.log('✅ Event RSVP created:', rsvp);
    return rsvp;
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
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_rsvps?id=eq.${rsvpId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating event RSVP:', errorText);
      throw new Error(`Failed to update event RSVP: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Update response text:', responseText);
    
    if (!responseText.trim()) {
      // Empty response - this is actually success for PATCH operations
      console.log('✅ Event RSVP updated (empty response)');
      return { id: rsvpId, status } as EventRSVP;
    }
    
    const rsvp = JSON.parse(responseText);
    console.log('✅ Event RSVP updated:', rsvp);
    return rsvp[0];
  }

  // Delete event RSVP
  static async deleteEventRSVP(rsvpId: string): Promise<void> {
    console.log('Deleting event RSVP:', { rsvpId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_rsvps?id=eq.${rsvpId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting event RSVP:', errorText);
      throw new Error(`Failed to delete event RSVP: ${errorText}`);
    }

    console.log('✅ Event RSVP deleted');
  }

  // Get user's RSVP for a specific event
  static async getUserEventRSVP(eventId: string, userId: string): Promise<EventRSVP | null> {
    console.log('Getting user event RSVP:', { eventId, userId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_rsvps?event_id=eq.${eventId}&user_id=eq.${userId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting user event RSVP:', errorText);
      throw new Error(`Failed to get user event RSVP: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get RSVP response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No user event RSVP found (empty response)');
      return null;
    }
    
    const rsvps = JSON.parse(responseText);
    console.log('✅ Retrieved user event RSVP:', rsvps);
    return rsvps.length > 0 ? rsvps[0] : null;
  }

  // Get all user's event RSVPs
  static async getUserEventRSVPs(userId: string): Promise<EventRSVP[]> {
    console.log('Getting user event RSVPs:', { userId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_rsvps?user_id=eq.${userId}&order=created_at.desc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting user event RSVPs:', errorText);
      throw new Error(`Failed to get user event RSVPs: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get RSVPs response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No user event RSVPs found (empty response)');
      return [];
    }
    
    const rsvps = JSON.parse(responseText);
    console.log('✅ Retrieved user event RSVPs:', rsvps.length);
    return rsvps;
  }

  // Get RSVP statistics for an event
  static async getEventRSVPStats(eventId: string): Promise<RSVPStats> {
    console.log('Getting event RSVP stats:', { eventId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_rsvps?event_id=eq.${eventId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting event RSVP stats:', errorText);
      throw new Error(`Failed to get event RSVP stats: ${errorText}`);
    }

    const rsvps = await response.json();
    
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
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_rsvps`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        activity_id: activityId,
        user_id: userId,
        status: status,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating activity RSVP:', errorText);
      throw new Error(`Failed to create activity RSVP: ${errorText}`);
    }

    const rsvp = await response.json();
    console.log('✅ Activity RSVP created:', rsvp);
    return rsvp;
  }

  // Get user's RSVP for a specific activity
  static async getUserActivityRSVP(activityId: string, userId: string): Promise<ActivityRSVP | null> {
    console.log('Getting user activity RSVP:', { activityId, userId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_rsvps?activity_id=eq.${activityId}&user_id=eq.${userId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting user activity RSVP:', errorText);
      throw new Error(`Failed to get user activity RSVP: ${errorText}`);
    }

    const rsvps = await response.json();
    return rsvps.length > 0 ? rsvps[0] : null;
  }

  // Delete RSVP (cancel RSVP)
  static async deleteEventRSVP(rsvpId: string): Promise<void> {
    console.log('Deleting event RSVP:', { rsvpId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_rsvps?id=eq.${rsvpId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting event RSVP:', errorText);
      throw new Error(`Failed to delete event RSVP: ${errorText}`);
    }

    console.log('✅ Event RSVP deleted');
  }

  // Delete activity RSVP
  static async deleteActivityRSVP(rsvpId: string): Promise<void> {
    console.log('Deleting activity RSVP:', { rsvpId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_rsvps?id=eq.${rsvpId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting activity RSVP:', errorText);
      throw new Error(`Failed to delete activity RSVP: ${errorText}`);
    }

    console.log('✅ Activity RSVP deleted');
  }

  // Get all RSVPs for a specific activity
  static async getActivityRSVPs(activityId: string): Promise<ActivityRSVP[]> {
    console.log('Getting activity RSVPs:', { activityId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_rsvps?activity_id=eq.${activityId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting activity RSVPs:', errorText);
      throw new Error(`Failed to get activity RSVPs: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get activity RSVPs response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No activity RSVPs found (empty response)');
      return [];
    }
    
    const rsvps = JSON.parse(responseText);
    console.log('✅ Retrieved activity RSVPs:', rsvps);
    return rsvps;
  }
}