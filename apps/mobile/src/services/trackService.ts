// Track service for managing event tracks and track assignments
// Uses REST API calls to avoid Supabase client compatibility issues with Expo Go

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
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all tracks for an event
   */
  static async getEventTracks(eventId: string): Promise<EventTrack[]> {
    try {
      console.log('Getting event tracks:', { eventId });
      
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/event_tracks?event_id=eq.${eventId}&is_active=eq.true&order=display_order.asc`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status}`);
      }

      const tracks = await response.json();
      console.log('✅ Retrieved event tracks:', tracks.length);
      return tracks;
    } catch (error) {
      console.error('Error fetching event tracks:', error);
      throw error;
    }
  }

  /**
   * Get a single track by ID
   */
  static async getTrack(trackId: string): Promise<EventTrack> {
    try {
      console.log('Getting track:', { trackId });
      
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/event_tracks?id=eq.${trackId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.status}`);
      }

      const tracks = await response.json();
      if (tracks.length === 0) {
        throw new Error('Track not found');
      }

      console.log('✅ Retrieved track:', tracks[0]);
      return tracks[0];
    } catch (error) {
      console.error('Error fetching track:', error);
      throw error;
    }
  }

  /**
   * Get track capacity information
   */
  static async getTrackCapacity(trackId: string): Promise<{ current_rsvps: number; max_capacity?: number }> {
    try {
      console.log('Getting track capacity:', { trackId });
      
      // Get current RSVPs for this track
      const rsvpResponse = await fetch(
        `${this.SUPABASE_URL}/rest/v1/event_rsvps?track_id=eq.${trackId}&status=eq.attending`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!rsvpResponse.ok) {
        throw new Error(`Failed to fetch track RSVPs: ${rsvpResponse.status}`);
      }

      const rsvps = await rsvpResponse.json();
      const current_rsvps = rsvps.length;

      // Get track max capacity
      const track = await this.getTrack(trackId);
      
      console.log('✅ Retrieved track capacity:', { current_rsvps, max_capacity: track.max_capacity });
      return {
        current_rsvps,
        max_capacity: track.max_capacity
      };
    } catch (error) {
      console.error('Error fetching track capacity:', error);
      throw error;
    }
  }

  /**
   * Get activities assigned to a track
   */
  static async getTrackActivities(trackId: string): Promise<any[]> {
    try {
      console.log('Getting track activities:', { trackId });
      
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/track_activities?track_id=eq.${trackId}&select=*,activities(*)`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch track activities: ${response.status}`);
      }

      const trackActivities = await response.json();
      const activities = trackActivities.map((ta: any) => ta.activities).filter(Boolean);
      console.log('✅ Retrieved track activities:', activities.length);
      return activities;
    } catch (error) {
      console.error('Error fetching track activities:', error);
      throw error;
    }
  }

  /**
   * Check if an event requires track selection
   */
  static async eventRequiresTracks(eventId: string): Promise<boolean> {
    try {
      console.log('Checking if event requires tracks:', { eventId });
      
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/events?id=eq.${eventId}&select=has_tracks`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch event track requirement: ${response.status}`);
      }

      const events = await response.json();
      if (events.length === 0) {
        throw new Error('Event not found');
      }

      const requiresTracks = events[0].has_tracks === true;
      console.log('✅ Event track requirement:', requiresTracks);
      return requiresTracks;
    } catch (error) {
      console.error('Error checking event track requirement:', error);
      throw error;
    }
  }

  /**
   * Get tracks with capacity information for an event
   */
  static async getEventTracksWithCapacity(eventId: string): Promise<EventTrack[]> {
    try {
      console.log('Getting event tracks with capacity:', { eventId });
      
      const tracks = await this.getEventTracks(eventId);
      
      // Get capacity for each track
      const tracksWithCapacity = await Promise.all(
        tracks.map(async (track) => {
          const capacity = await this.getTrackCapacity(track.id);
          return {
            ...track,
            current_rsvps: capacity.current_rsvps,
            max_capacity: capacity.max_capacity
          };
        })
      );

      console.log('✅ Retrieved event tracks with capacity:', tracksWithCapacity.length);
      return tracksWithCapacity;
    } catch (error) {
      console.error('Error fetching event tracks with capacity:', error);
      throw error;
    }
  }

  /**
   * Check if a track is at capacity
   */
  static async isTrackAtCapacity(trackId: string): Promise<boolean> {
    try {
      const capacity = await this.getTrackCapacity(trackId);
      
      if (!capacity.max_capacity) {
        return false; // No capacity limit
      }
      
      return capacity.current_rsvps >= capacity.max_capacity;
    } catch (error) {
      console.error('Error checking track capacity:', error);
      throw error;
    }
  }
}
