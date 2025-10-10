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

export interface CreateSpeakerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  bio?: string;
  expertise: string[];
  profileImageUrl?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
  isPublic: boolean;
  allowContact: boolean;
  tags: string[];
}

export interface UpdateSpeakerData extends Partial<CreateSpeakerData> {
  id: string;
}

import { supabase, getServiceRoleClient } from '../lib/supabase';

export class SpeakersService {

  // Get all speakers
  static async getAllSpeakers(): Promise<Speaker[]> {
    console.log('Getting all speakers');
    
    const { data: speakersData, error } = await supabase
      .from('speakers')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error getting all speakers:', error);
      throw new Error(`Failed to get speakers: ${error.message}`);
    }

    if (!speakersData || speakersData.length === 0) {
      console.log('✅ No speakers found');
      return [];
    }
    
    console.log('✅ Retrieved all speakers:', speakersData.length);
    
    // Transform snake_case to camelCase
    const speakers = speakersData.map((speaker: any) => ({
      id: speaker.id,
      organizationId: speaker.organization_id,
      firstName: speaker.first_name,
      lastName: speaker.last_name,
      email: speaker.email,
      phone: speaker.phone,
      title: speaker.title,
      company: speaker.company,
      bio: speaker.bio,
      expertise: speaker.expertise || [],
      profileImageUrl: speaker.profile_image_url,
      headshotUrl: speaker.headshot_url,
      socialLinks: speaker.social_links || {},
      isPublic: speaker.is_public,
      allowContact: speaker.allow_contact,
      tags: speaker.tags || [],
      metadata: speaker.metadata || {},
      createdAt: speaker.created_at,
      updatedAt: speaker.updated_at,
    }));
    
    return speakers;
  }

  // Get speaker by ID
  static async getSpeakerById(speakerId: string): Promise<Speaker> {
    console.log('Getting speaker by ID:', { speakerId });
    
    const { data: speakerData, error } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', speakerId)
      .single();

    if (error) {
      console.error('Error getting speaker:', error);
      throw new Error(`Failed to get speaker: ${error.message}`);
    }

    if (!speakerData) {
      throw new Error('Speaker not found');
    }
    
    // Transform snake_case to camelCase
    const speaker = {
      id: speakerData.id,
      organizationId: speakerData.organization_id,
      firstName: speakerData.first_name,
      lastName: speakerData.last_name,
      email: speakerData.email,
      phone: speakerData.phone,
      title: speakerData.title,
      company: speakerData.company,
      bio: speakerData.bio,
      expertise: speakerData.expertise || [],
      profileImageUrl: speakerData.profile_image_url,
      headshotUrl: speakerData.headshot_url,
      socialLinks: speakerData.social_links || {},
      isPublic: speakerData.is_public,
      allowContact: speakerData.allow_contact,
      tags: speakerData.tags || [],
      metadata: speakerData.metadata || {},
      createdAt: speakerData.created_at,
      updatedAt: speakerData.updated_at,
    };
    
    console.log('✅ Retrieved speaker:', speaker);
    return speaker;
  }

  // Create new speaker
  static async createSpeaker(data: CreateSpeakerData): Promise<Speaker> {
    console.log('Creating speaker:', data);
    
    const { data: speakerData, error } = await supabase
      .from('speakers')
      .insert({
        organization_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Default org for now
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        company: data.company,
        bio: data.bio,
        expertise: data.expertise,
        profile_image_url: data.profileImageUrl,
        social_links: data.socialLinks,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        tags: data.tags,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating speaker:', error);
      throw new Error(`Failed to create speaker: ${error.message}`);
    }

    if (!speakerData) {
      throw new Error('Failed to create speaker - no data returned');
    }
    
    // Transform snake_case to camelCase
    const speaker = {
      id: speakerData.id,
      organizationId: speakerData.organization_id,
      firstName: speakerData.first_name,
      lastName: speakerData.last_name,
      email: speakerData.email,
      phone: speakerData.phone,
      title: speakerData.title,
      company: speakerData.company,
      bio: speakerData.bio,
      expertise: speakerData.expertise || [],
      profileImageUrl: speakerData.profile_image_url,
      headshotUrl: speakerData.headshot_url,
      socialLinks: speakerData.social_links || {},
      isPublic: speakerData.is_public,
      allowContact: speakerData.allow_contact,
      tags: speakerData.tags || [],
      metadata: speakerData.metadata || {},
      createdAt: speakerData.created_at,
      updatedAt: speakerData.updated_at,
    };
    
    console.log('✅ Speaker created:', speaker);
    return speaker;
  }

  // Update speaker
  static async updateSpeaker(data: UpdateSpeakerData): Promise<Speaker> {
    console.log('Updating speaker:', data);
    
    const { data: speakerData, error } = await supabase
      .from('speakers')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        company: data.company,
        bio: data.bio,
        expertise: data.expertise,
        profile_image_url: data.profileImageUrl,
        social_links: data.socialLinks,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        tags: data.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating speaker:', error);
      throw new Error(`Failed to update speaker: ${error.message}`);
    }

    if (!speakerData) {
      // If no response, fetch the updated speaker data
      console.log('✅ Speaker updated successfully, fetching updated data...');
      return await this.getSpeakerById(data.id);
    }
    
    // Transform snake_case to camelCase
    const speaker = {
      id: speakerData.id,
      organizationId: speakerData.organization_id,
      firstName: speakerData.first_name,
      lastName: speakerData.last_name,
      email: speakerData.email,
      phone: speakerData.phone,
      title: speakerData.title,
      company: speakerData.company,
      bio: speakerData.bio,
      expertise: speakerData.expertise || [],
      profileImageUrl: speakerData.profile_image_url,
      headshotUrl: speakerData.headshot_url,
      socialLinks: speakerData.social_links || {},
      isPublic: speakerData.is_public,
      allowContact: speakerData.allow_contact,
      tags: speakerData.tags || [],
      metadata: speakerData.metadata || {},
      createdAt: speakerData.created_at,
      updatedAt: speakerData.updated_at,
    };
    
    console.log('✅ Speaker updated:', speaker);
    return speaker;
  }

  // Delete speaker
  static async deleteSpeaker(speakerId: string): Promise<void> {
    console.log('Deleting speaker:', { speakerId });
    
    const { error } = await supabase
      .from('speakers')
      .delete()
      .eq('id', speakerId);

    if (error) {
      console.error('Error deleting speaker:', error);
      throw new Error(`Failed to delete speaker: ${error.message}`);
    }

    console.log('✅ Speaker deleted');
  }

  // Get speaker's assigned events
  static async getSpeakerEvents(speakerId: string): Promise<string[]> {
    console.log('Getting speaker events:', { speakerId });
    
    const { data: eventData, error } = await supabase
      .from('event_speakers')
      .select('event_id')
      .eq('speaker_id', speakerId);

    if (error) {
      console.error('Error getting speaker events:', error);
      throw new Error(`Failed to get speaker events: ${error.message}`);
    }

    if (!eventData || eventData.length === 0) {
      console.log('✅ No events found for speaker');
      return [];
    }
    
    const eventIds = eventData.map((item: any) => item.event_id);
    
    console.log('✅ Retrieved speaker events:', eventIds);
    return eventIds;
  }

  // Get speaker's assigned activities
  static async getSpeakerActivities(speakerId: string): Promise<string[]> {
    console.log('Getting speaker activities:', { speakerId });
    
    const { data: activityData, error } = await supabase
      .from('activity_speakers')
      .select('activity_id')
      .eq('speaker_id', speakerId);

    if (error) {
      console.error('Error getting speaker activities:', error);
      throw new Error(`Failed to get speaker activities: ${error.message}`);
    }

    if (!activityData || activityData.length === 0) {
      console.log('✅ No activities found for speaker');
      return [];
    }
    
    const activityIds = activityData.map((item: any) => item.activity_id);
    
    console.log('✅ Retrieved speaker activities:', activityIds);
    return activityIds;
  }

  // Assign speaker to activity
  static async assignSpeakerToActivity(speakerId: string, activityId: string): Promise<void> {
    console.log('Assigning speaker to activity:', { speakerId, activityId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_speakers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        speaker_id: speakerId,
        activity_id: activityId,
        role: 'speaker',
        display_order: 0,
        is_confirmed: true,
        is_public: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error assigning speaker to activity:', errorText);
      throw new Error(`Failed to assign speaker to activity: ${errorText}`);
    }

    console.log('✅ Speaker assigned to activity');
  }

  // Unassign speaker from activity
  static async unassignSpeakerFromActivity(speakerId: string, activityId: string): Promise<void> {
    console.log('Unassigning speaker from activity:', { speakerId, activityId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_speakers?speaker_id=eq.${speakerId}&activity_id=eq.${activityId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning speaker from activity:', errorText);
      throw new Error(`Failed to unassign speaker from activity: ${errorText}`);
    }

    console.log('✅ Speaker unassigned from activity');
  }

  // Bulk assign speaker to multiple activities
  static async assignSpeakerToActivities(speakerId: string, activityIds: string[]): Promise<void> {
    console.log('Bulk assigning speaker to activities:', { speakerId, activityIds });
    
    // First, remove existing assignments for this speaker
    await this.unassignSpeakerFromAllActivities(speakerId);
    
    // Then assign to new activities
    const assignments = activityIds.map(activityId => ({
      speaker_id: speakerId,
      activity_id: activityId,
      role: 'speaker',
      display_order: 0,
      is_confirmed: true,
      is_public: true,
    }));

    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_speakers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(assignments),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error bulk assigning speaker to activities:', errorText);
      throw new Error(`Failed to bulk assign speaker to activities: ${errorText}`);
    }

    console.log('✅ Speaker bulk assigned to activities');
  }

  // Unassign speaker from all activities
  static async unassignSpeakerFromAllActivities(speakerId: string): Promise<void> {
    console.log('Unassigning speaker from all activities:', { speakerId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_speakers?speaker_id=eq.${speakerId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning speaker from all activities:', errorText);
      throw new Error(`Failed to unassign speaker from all activities: ${errorText}`);
    }

    console.log('✅ Speaker unassigned from all activities');
  }
}
