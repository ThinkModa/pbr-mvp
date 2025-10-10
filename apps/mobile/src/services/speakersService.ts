import { supabase } from '../lib/supabase';
export interface Speaker {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  bio?: string;
  expertise: string[];
  profileImageUrl?: string;
  headshotUrl?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
  isPublic: boolean;
  allowContact: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EventSpeaker {
  id: string;
  eventId: string;
  speakerId: string;
  role: string;
  sessionTitle?: string;
  sessionDescription?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  displayOrder: number;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  speaker?: Speaker;
}

export interface ActivitySpeaker {
  id: string;
  activityId: string;
  speakerId: string;
  role: string;
  displayOrder: number;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  speaker?: Speaker;
}

export class SpeakersService {


  // Transform snake_case data from database to camelCase for frontend
  private static transformSpeakerData(data: any): Speaker {
    return {
      id: data.id,
      organizationId: data.organization_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      title: data.title,
      company: data.company,
      bio: data.bio,
      expertise: data.expertise || [],
      profileImageUrl: data.profile_image_url,
      headshotUrl: data.headshot_url,
      socialLinks: data.social_links || {},
      isPublic: data.is_public,
      allowContact: data.allow_contact,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Get all speakers for an event
  static async getEventSpeakers(eventId: string): Promise<EventSpeaker[]> {
    console.log('Getting event speakers:', { eventId });
    
    const { data: eventSpeakers, error } = await supabase
      .from('event_speakers')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error getting event speakers:', error);
      throw new Error(`Failed to get event speakers: ${error.message}`);
    }
    console.log('✅ Retrieved event speakers:', eventSpeakers.length);

    // Fetch speaker details for each event speaker
    const speakersWithDetails = await Promise.all(
      eventSpeakers.map(async (eventSpeaker: any) => {
        try {
          const speaker = await this.getSpeakerById(eventSpeaker.speaker_id);
          return { ...eventSpeaker, speaker };
        } catch (error) {
          console.error('Error fetching speaker details:', error);
          return eventSpeaker;
        }
      })
    );

    return speakersWithDetails;
  }

  // Get speakers for a specific activity
  static async getActivitySpeakers(activityId: string): Promise<ActivitySpeaker[]> {
    console.log('Getting activity speakers:', { activityId });
    
    const { data: activitySpeakers, error } = await supabase
      .from('activity_speakers')
      .select('*')
      .eq('activity_id', activityId)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error getting activity speakers:', error);
      throw new Error(`Failed to get activity speakers: ${error.message}`);
    }
    console.log('✅ Retrieved activity speakers:', activitySpeakers.length);

    // Fetch speaker details for each activity speaker
    const speakersWithDetails = await Promise.all(
      activitySpeakers.map(async (activitySpeaker: any) => {
        try {
          const speaker = await this.getSpeakerById(activitySpeaker.speaker_id);
          return { ...activitySpeaker, speaker };
        } catch (error) {
          console.error('Error fetching speaker details:', error);
          return activitySpeaker;
        }
      })
    );

    return speakersWithDetails;
  }

  // Get speaker by ID
  static async getSpeakerById(speakerId: string): Promise<Speaker> {
    console.log('Getting speaker by ID:', { speakerId });
    
    const { data: speakers, error } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', speakerId)
      .eq('is_public', true);

    if (error) {
      console.error('Error getting speaker:', error);
      throw new Error(`Failed to get speaker: ${error.message}`);
    }

    if (!speakers || speakers.length === 0) {
      throw new Error('Speaker not found');
    }
    
    // Transform snake_case to camelCase
    const speaker = this.transformSpeakerData(speakers[0]);
    console.log('✅ Retrieved speaker:', speaker);
    return speaker;
  }

  // Get all public speakers (for admin selection)
  static async getAllSpeakers(): Promise<Speaker[]> {
    console.log('Getting all speakers');
    
    const { data: speakers, error } = await supabase
      .from('speakers')
      .select('*')
      .eq('is_public', true)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error getting all speakers:', error);
      throw new Error(`Failed to get all speakers: ${error.message}`);
    }
    console.log('✅ Retrieved all speakers:', speakers.length);
    
    // Transform snake_case to camelCase
    return speakers.map(speaker => this.transformSpeakerData(speaker));
  }
}
