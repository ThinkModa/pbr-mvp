import { supabase, getServiceRoleClient } from '../lib/supabase';
import { Database } from '../types/database';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

type Activity = Database['public']['Tables']['activities']['Row'];
type ActivityInsert = Database['public']['Tables']['activities']['Insert'];

export interface EventWithActivities extends Event {
  activities: Activity[];
  // Add missing properties that the dashboard expects
  name?: string; // Alias for title
  start_date?: string; // Alias for start_time
  end_date?: string; // Alias for end_time
  has_tracks?: boolean; // Track system property
}

export class EventsService {
  // Get all events with their activities
  static async getEvents(): Promise<EventWithActivities[]> {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        activities (*)
      `)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    // Transform events to include expected properties
    return (events || []).map(event => ({
      ...event,
      name: event.title, // Alias for title
      start_date: event.start_time, // Alias for start_time
      end_date: event.end_time, // Alias for end_time
      has_tracks: event.has_tracks || false, // Default to false if not set
    }));
  }

  // Create a new event
  static async createEvent(eventData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    location: {
      name: string;
      address: string;
      coordinates?: { lat: number; lng: number };
      placeId?: string;
    };
    capacity?: number;
    price?: number;
    show_capacity?: boolean;
    show_price?: boolean;
    show_attendee_count?: boolean;
    has_tracks?: boolean;
    cover_image_url?: string;
    activities: Array<{
      name: string;
      description: string;
      start_time: string;
      end_time: string;
      location: {
        name: string;
        address: string;
        coordinates?: { lat: number; lng: number };
        placeId?: string;
      };
      category: string;
      capacity?: number;
      is_required: boolean;
    }>;
  }): Promise<EventWithActivities> {
    const serviceClient = getServiceRoleClient();

    // Start a transaction
    const { data: event, error: eventError } = await serviceClient
      .from('events')
          .insert({
            title: eventData.name,
            description: eventData.description,
            start_time: eventData.start_date,
            end_time: eventData.end_date,
            location: eventData.location,
            location_address: eventData.location.address,
            latitude: eventData.location.coordinates?.lat,
            longitude: eventData.location.coordinates?.lng,
            max_capacity: eventData.capacity,
            price: eventData.price ? eventData.price * 100 : undefined, // Convert to cents
            is_free: !eventData.price,
            show_capacity: eventData.show_capacity ?? true,
            show_price: eventData.show_price ?? true,
            show_attendee_count: eventData.show_attendee_count ?? true,
            has_tracks: eventData.has_tracks ?? false,
            cover_image_url: eventData.cover_image_url,
            slug: eventData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            organization_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // PBR Community org
            status: eventData.status || 'published',
            is_public: true, // Make events visible to mobile app
          })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    // Create activities for the event
    if (eventData.activities.length > 0) {
      const activitiesData: ActivityInsert[] = eventData.activities.map(activity => ({
        event_id: event.id,
        title: activity.name,
        description: activity.description,
        start_time: activity.start_time,
        end_time: activity.end_time,
        location: activity.location,
        max_capacity: activity.capacity ? parseInt(activity.capacity.toString()) : undefined,
        is_required: activity.is_required,
      }));

      const { error: activitiesError } = await serviceClient
        .from('activities')
        .insert(activitiesData);

      if (activitiesError) {
        console.error('Error creating activities:', activitiesError);
        throw activitiesError;
      }
    }

    // Fetch the complete event with activities
    const { data: completeEvent, error: fetchError } = await serviceClient
      .from('events')
      .select(`
        *,
        activities (*)
      `)
      .eq('id', event.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete event:', fetchError);
      throw fetchError;
    }

    return completeEvent;
  }

  // Update an existing event
  static async updateEvent(
    eventId: string,
    eventData: {
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      location: {
        name: string;
        address: string;
        coordinates?: { lat: number; lng: number };
        placeId?: string;
      };
      capacity?: number;
      price?: number;
      show_capacity?: boolean;
      show_price?: boolean;
      show_attendee_count?: boolean;
      has_tracks?: boolean;
      cover_image_url?: string;
      activities: Array<{
        id?: string;
        name: string;
        description: string;
        start_time: string;
        end_time: string;
        location: {
          name: string;
          address: string;
          coordinates?: { lat: number; lng: number };
          placeId?: string;
        };
        category: string;
        capacity?: number;
        is_required: boolean;
      }>;
    }
  ): Promise<EventWithActivities> {
    const serviceClient = getServiceRoleClient();

    // Update the event
    const { error: eventError } = await serviceClient
      .from('events')
          .update({
            title: eventData.name,
            description: eventData.description,
            start_time: eventData.start_date,
            end_time: eventData.end_date,
            location: eventData.location,
            max_capacity: eventData.capacity,
            price: eventData.price ? eventData.price * 100 : undefined, // Convert to cents
            is_free: !eventData.price,
            show_capacity: eventData.show_capacity ?? true,
            show_price: eventData.show_price ?? true,
            show_attendee_count: eventData.show_attendee_count ?? true,
            has_tracks: eventData.has_tracks ?? false,
            cover_image_url: eventData.cover_image_url,
            slug: eventData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            status: eventData.status || 'published',
            is_public: true, // Keep events visible to mobile app
            updated_at: new Date().toISOString(),
          })
      .eq('id', eventId);

    if (eventError) {
      console.error('Error updating event:', eventError);
      throw eventError;
    }

    // Delete existing activities
    const { error: deleteError } = await serviceClient
      .from('activities')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('Error deleting activities:', deleteError);
      throw deleteError;
    }

    // Create new activities
    if (eventData.activities.length > 0) {
      const activitiesData: ActivityInsert[] = eventData.activities.map(activity => ({
        event_id: eventId,
        title: activity.name,
        description: activity.description,
        start_time: activity.start_time,
        end_time: activity.end_time,
        location: { name: activity.location },
        max_capacity: activity.capacity ? parseInt(activity.capacity.toString()) : undefined,
        is_required: activity.is_required,
      }));

      const { error: activitiesError } = await serviceClient
        .from('activities')
        .insert(activitiesData);

      if (activitiesError) {
        console.error('Error creating activities:', activitiesError);
        throw activitiesError;
      }
    }

    // Fetch the updated event with activities
    const { data: completeEvent, error: fetchError } = await serviceClient
      .from('events')
      .select(`
        *,
        activities (*)
      `)
      .eq('id', eventId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated event:', fetchError);
      throw fetchError;
    }

    return completeEvent;
  }

  // Delete an event
  static async deleteEvent(eventId: string): Promise<void> {
    const serviceClient = getServiceRoleClient();

    // Delete activities first (foreign key constraint)
    const { error: activitiesError } = await serviceClient
      .from('activities')
      .delete()
      .eq('event_id', eventId);

    if (activitiesError) {
      console.error('Error deleting activities:', activitiesError);
      throw activitiesError;
    }

    // Delete the event
    const { error: eventError } = await serviceClient
      .from('events')
      .delete()
      .eq('id', eventId);

    if (eventError) {
      console.error('Error deleting event:', eventError);
      throw eventError;
    }
  }

  // Get a single event by ID
  static async getEventById(eventId: string): Promise<EventWithActivities | null> {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        activities (*)
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return event;
  }

  // Get upcoming events (for speaker assignment)
  static async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date().toISOString();
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', now)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }

    return events || [];
  }

  // Assign speaker to event
  static async assignSpeakerToEvent(speakerId: string, eventId: string): Promise<void> {
    const serviceClient = getServiceRoleClient();

    const { error } = await serviceClient
      .from('event_speakers')
      .insert({
        speaker_id: speakerId,
        event_id: eventId,
        role: 'speaker',
        display_order: 0,
        is_confirmed: true,
        is_public: true
      });

    if (error) {
      console.error('Error assigning speaker to event:', error);
      throw error;
    }
  }

  // Unassign speaker from event
  static async unassignSpeakerFromEvent(speakerId: string, eventId: string): Promise<void> {
    const serviceClient = getServiceRoleClient();

    const { error } = await serviceClient
      .from('event_speakers')
      .delete()
      .eq('speaker_id', speakerId)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error unassigning speaker from event:', error);
      throw error;
    }
  }

  // Get speaker's assigned events
  static async getSpeakerEvents(speakerId: string): Promise<string[]> {
    const { data: assignments, error } = await supabase
      .from('event_speakers')
      .select('event_id')
      .eq('speaker_id', speakerId);

    if (error) {
      console.error('Error fetching speaker events:', error);
      throw error;
    }

    return assignments?.map(a => a.event_id) || [];
  }
}
