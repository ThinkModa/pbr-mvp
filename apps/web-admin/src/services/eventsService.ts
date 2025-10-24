import { supabase, getServiceRoleClient } from '../lib/supabase';

// Use any for now to avoid type issues
type Event = any;
// type EventInsert = any;
// type EventUpdate = any;
type Activity = any;
type ActivityInsert = any;

export interface EventWithActivities extends Event {
  activities: Activity[];
  // Add missing properties that the dashboard expects
  name?: string; // Alias for title
  start_date?: string; // Alias for start_time
  end_date?: string; // Alias for end_time
  has_tracks?: boolean; // Track system property
  status?: string; // Event status
}

export class EventsService {
  // Get all events with their activities
  static async getEvents(): Promise<EventWithActivities[]> {
    console.log('🔧 EventsService.getEvents() called');
    const serviceClient = getServiceRoleClient();
    console.log('🔧 Service client created');
    
    try {
      const { data: events, error } = await serviceClient
        .from('events')
        .select(`
          *,
          activities (*)
        `)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching events:', error);
        throw error;
      }

      console.log('✅ Events fetched successfully:', events?.length || 0);
      
      // Transform events to include expected properties
      const transformedEvents = (events || []).map(event => {
        console.log('🔍 Raw event data:', {
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time
        });
        
        return {
          ...event,
          name: event.title, // Alias for title
          start_date: event.start_time, // Alias for start_time
          end_date: event.end_time, // Alias for end_time
          has_tracks: event.has_tracks || false, // Default to false if not set
        };
      });
      
      console.log('🔍 Transformed events:', transformedEvents);
      return transformedEvents;
    } catch (error) {
      console.error('💥 Exception in getEvents:', error);
      throw error;
    }
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
    status?: string;
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

    console.log('📝 Creating event with location data:', {
      location: eventData.location,
      coordinates: eventData.location.coordinates,
      latitude: eventData.location.coordinates?.lat,
      longitude: eventData.location.coordinates?.lng
    });

    // Start a transaction
    const { data: event, error: eventError } = await serviceClient
      .from('events')
          .insert({
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
        location: typeof activity.location === 'string' 
          ? { name: activity.location } 
          : activity.location,
        // Removed location_address, latitude, longitude - these columns don't exist in activities table
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

    // Send push notification for new event
    try {
      await this.sendEventCreatedNotification(completeEvent);
    } catch (notificationError) {
      console.error('❌ Error sending event created notification:', notificationError);
      // Don't throw - event creation should succeed even if notification fails
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
      status?: string;
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
    console.log('🔧 EventsService.updateEvent() called for eventId:', eventId);
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
            // Removed location_address - this column doesn't exist in events table
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
      console.error('❌ Error updating event:', eventError);
      throw eventError;
    }

    console.log('✅ Event updated successfully');

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
        location: typeof activity.location === 'string' 
          ? { name: activity.location } 
          : activity.location,
        // Removed location_address - this column doesn't exist in activities table
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

    // Send push notification for event update
    try {
      await this.sendEventUpdatedNotification(completeEvent);
    } catch (notificationError) {
      console.error('❌ Error sending event updated notification:', notificationError);
      // Don't throw - event update should succeed even if notification fails
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
    const serviceClient = getServiceRoleClient();
    
    const { data: event, error } = await serviceClient
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
    const serviceClient = getServiceRoleClient();
    const now = new Date().toISOString();
    
    const { data: events, error } = await serviceClient
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
    const serviceClient = getServiceRoleClient();
    
    const { data: assignments, error } = await serviceClient
      .from('event_speakers')
      .select('event_id')
      .eq('speaker_id', speakerId);

    if (error) {
      console.error('Error fetching speaker events:', error);
      throw error;
    }

    return assignments?.map(a => a.event_id) || [];
  }

  // Send push notification for new event creation
  private static async sendEventCreatedNotification(event: any): Promise<void> {
    try {
      console.log('🔔 Sending event created notification for:', event.title);
      
      // Get all users who should receive notifications
      const { data: users, error } = await getServiceRoleClient()
        .from('users')
        .select('id, push_tokens')
        .eq('is_active', true)
        .not('push_tokens', 'is', null);

      if (error) {
        console.error('❌ Error fetching users for notification:', error);
        return;
      }

      if (!users || users.length === 0) {
        console.log('ℹ️ No users with push tokens found');
        return;
      }

      // Send push notification to all users
      const pushTokens = users.flatMap(user => user.push_tokens || []);
      
      if (pushTokens.length === 0) {
        console.log('ℹ️ No push tokens found');
        return;
      }

      const notification = {
        title: 'New Event Created',
        body: `A new event "${event.title}" has been created. Check it out and RSVP!`,
        data: {
          eventId: event.id,
          type: 'event_created'
        }
      };

      await this.sendExpoPushNotifications(pushTokens, notification);
      console.log('✅ Event created notification sent to', pushTokens.length, 'users');

    } catch (error) {
      console.error('❌ Error sending event created notification:', error);
    }
  }

  // Send push notification for event updates
  private static async sendEventUpdatedNotification(event: any): Promise<void> {
    try {
      console.log('🔔 Sending event updated notification for:', event.title);
      
      // Get all users who RSVP'd to this event
      const { data: rsvps, error } = await getServiceRoleClient()
        .from('event_rsvps')
        .select(`
          user_id,
          users!inner(id, push_tokens)
        `)
        .eq('event_id', event.id)
        .eq('status', 'confirmed');

      if (error) {
        console.error('❌ Error fetching RSVPs for notification:', error);
        return;
      }

      if (!rsvps || rsvps.length === 0) {
        console.log('ℹ️ No RSVPs found for event');
        return;
      }

      // Send push notification to all RSVP'd users
      const pushTokens = rsvps.flatMap(rsvp => (rsvp.users as any)?.push_tokens || []);
      
      if (pushTokens.length === 0) {
        console.log('ℹ️ No push tokens found for RSVP users');
        return;
      }

      const notification = {
        title: 'Event Updated',
        body: `The details for "${event.title}" have been updated. Please check the new information.`,
        data: {
          eventId: event.id,
          type: 'event_updated'
        }
      };

      await this.sendExpoPushNotifications(pushTokens, notification);
      console.log('✅ Event updated notification sent to', pushTokens.length, 'users');

    } catch (error) {
      console.error('❌ Error sending event updated notification:', error);
    }
  }

  // Send Expo push notifications
  private static async sendExpoPushNotifications(pushTokens: string[], notification: any): Promise<void> {
    try {
      const messages = pushTokens.map(token => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('✅ Push notifications sent:', result);

    } catch (error) {
      console.error('❌ Error sending Expo push notifications:', error);
    }
  }
}
