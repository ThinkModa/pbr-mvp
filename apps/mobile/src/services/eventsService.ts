// Real events service that fetches from Supabase via REST API
// This avoids Supabase client compatibility issues with Expo Go
//
// CRITICAL RULE: Test environment must ALWAYS use live database data, never mock data.
// This ensures real-time sync between desktop admin and mobile app for true integration testing.

export interface EventWithActivities {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { 
    name: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  } | null;
  // Extracted coordinate fields for UI components
  latitude?: number;
  longitude?: number;
  location_address?: string;
  max_capacity: number | null;
  current_rsvps: number;
  is_free: boolean;
  price: number | null;
  show_capacity: boolean;
  show_price: boolean;
  show_attendee_count: boolean;
  has_tracks: boolean;
  cover_image_url: string | null;
  activities: Activity[];
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { 
    name: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  } | null;
  // Extracted coordinate fields for UI components
  latitude?: number;
  longitude?: number;
  location_address?: string;
  max_capacity: number | null;
  current_rsvps: number;
  is_required: boolean;
  event_id: string;
}

export class EventsService {
  // Use cloud Supabase for OAuth testing
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  // Get all published events with their activities
  static async getEvents(): Promise<EventWithActivities[]> {
    console.log('Fetching events from live Supabase database...');
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/events?select=*,activities(*)&is_public=eq.true&status=eq.published&order=start_time.asc`,
      {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch events from live database. HTTP ${response.status}: ${errorText}`);
    }

    const events = await response.json();
    console.log('✅ Successfully fetched', events.length, 'events from live database');
    
    // Transform events to extract coordinates from location JSONB field
    const transformedEvents = events.map((event: any) => {
      // Extract coordinates from location JSONB field
      const location = event.location;
      if (location && location.coordinates) {
        event.latitude = location.coordinates.lat;
        event.longitude = location.coordinates.lng;
        event.location_address = location.address || location.name;
      }
      
      // Transform activities to extract coordinates
      if (event.activities && Array.isArray(event.activities)) {
        event.activities = event.activities.map((activity: any) => {
          const activityLocation = activity.location;
          if (activityLocation && activityLocation.coordinates) {
            activity.latitude = activityLocation.coordinates.lat;
            activity.longitude = activityLocation.coordinates.lng;
            activity.location_address = activityLocation.address || activityLocation.name;
          }
          return activity;
        });
      }
      
      return event;
    });
    
    // Debug: Log the first event's activities and coordinates
    if (transformedEvents.length > 0) {
      console.log('First event activities:', transformedEvents[0].activities);
      console.log('First event coordinates:', {
        latitude: transformedEvents[0].latitude,
        longitude: transformedEvents[0].longitude,
        location_address: transformedEvents[0].location_address,
        location: transformedEvents[0].location
      });
      if (transformedEvents[0].activities && transformedEvents[0].activities.length > 0) {
        console.log('First activity details:', transformedEvents[0].activities[0]);
        console.log('First activity coordinates:', {
          latitude: transformedEvents[0].activities[0].latitude,
          longitude: transformedEvents[0].activities[0].longitude,
          location_address: transformedEvents[0].activities[0].location_address
        });
      }
    }
    
    return transformedEvents || [];
  }

  // NOTE: No mock data - test environment must always use live database

  // Get a single event by ID
  static async getEventById(eventId: string): Promise<EventWithActivities | null> {
    const events = await this.getEvents();
    return events.find(event => event.id === eventId) || null;
  }

  // Get upcoming events (events that haven't started yet)
  static async getUpcomingEvents(): Promise<EventWithActivities[]> {
    const events = await this.getEvents();
    const now = new Date().toISOString();
    return events.filter(event => event.start_time > now);
  }

  // Get events by date range
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<EventWithActivities[]> {
    const events = await this.getEvents();
    return events.filter(event => 
      event.start_time >= startDate && event.end_time <= endDate
    );
  }

  // Get all activities for a specific event
  static async getEventActivities(eventId: string): Promise<Activity[]> {
    console.log('Fetching activities for event:', eventId);
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activities?event_id=eq.${eventId}&order=start_time.asc`,
      {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching event activities:', errorText);
      throw new Error(`Failed to fetch event activities: ${errorText}`);
    }

    const activities = await response.json();
    console.log('✅ Successfully fetched', activities.length, 'activities for event', eventId);
    return activities || [];
  }
}
