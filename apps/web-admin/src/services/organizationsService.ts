export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  isPublic: boolean;
  allowContact: boolean;
  isSponsor: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  isPublic: boolean;
  allowContact: boolean;
  isSponsor: boolean;
  tags: string[];
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string;
}

import { supabase, getServiceRoleClient } from '../lib/supabase';

export class OrganizationsService {
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }

  // Get all organizations
  static async getAllOrganizations(): Promise<Organization[]> {
    console.log('Getting all organizations');
    
    const { data: organizationsData, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting all organizations:', error);
      throw new Error(`Failed to get organizations: ${error.message}`);
    }

    if (!organizationsData || organizationsData.length === 0) {
      console.log('✅ No organizations found');
      return [];
    }
    
    console.log('✅ Retrieved all organizations:', organizationsData.length);
    
    // Transform snake_case to camelCase
    const organizations = organizationsData.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      website: org.website,
      email: org.email,
      phone: org.phone,
      address: org.address,
      logoUrl: org.logo_url,
      industry: org.industry,
      size: org.size,
      foundedYear: org.founded_year,
      isPublic: org.is_public,
      allowContact: org.allow_contact,
      isSponsor: org.is_sponsor,
      tags: org.tags || [],
      metadata: org.metadata || {},
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    }));
    
    return organizations;
  }

  // Get organization by ID
  static async getOrganizationById(organizationId: string): Promise<Organization> {
    console.log('Getting organization by ID:', { organizationId });
    
    const { data: organizationsData, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error getting organization:', error);
      throw new Error(`Failed to get organization: ${error.message}`);
    }

    if (!organizationsData) {
      throw new Error('Organization not found');
    }
    
    const orgData = organizationsData;
    
    // Transform snake_case to camelCase
    const organization = {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logoUrl: orgData.logo_url,
      industry: orgData.industry,
      size: orgData.size,
      foundedYear: orgData.founded_year,
      isPublic: orgData.is_public,
      allowContact: orgData.allow_contact,
      isSponsor: orgData.is_sponsor,
      tags: orgData.tags || [],
      metadata: orgData.metadata || {},
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at,
    };
    
    console.log('✅ Retrieved organization:', organization);
    return organization;
  }

  // Create new organization
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    console.log('Creating organization:', data);
    
    const { data: orgData, error } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug || this.generateSlug(data.name),
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo_url: data.logoUrl,
        industry: data.industry,
        size: data.size,
        founded_year: data.foundedYear,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        is_sponsor: data.isSponsor,
        tags: data.tags,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      throw new Error(`Failed to create organization: ${error.message}`);
    }

    if (!orgData) {
      throw new Error('Failed to create organization - no data returned');
    }
    
    // Transform snake_case to camelCase
    const organization = {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logoUrl: orgData.logo_url,
      industry: orgData.industry,
      size: orgData.size,
      foundedYear: orgData.founded_year,
      isPublic: orgData.is_public,
      allowContact: orgData.allow_contact,
      isSponsor: orgData.is_sponsor,
      tags: orgData.tags || [],
      metadata: orgData.metadata || {},
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at,
    };
    
    console.log('✅ Organization created:', organization);
    return organization;
  }

  // Update organization
  static async updateOrganization(data: UpdateOrganizationData): Promise<Organization> {
    console.log('Updating organization:', data);
    
    const { data: orgData, error } = await supabase
      .from('organizations')
      .update({
        name: data.name,
        slug: data.slug || (data.name ? this.generateSlug(data.name) : undefined),
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo_url: data.logoUrl,
        industry: data.industry,
        size: data.size,
        founded_year: data.foundedYear,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        is_sponsor: data.isSponsor,
        tags: data.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      throw new Error(`Failed to update organization: ${error.message}`);
    }

    if (!orgData) {
      // If no response, fetch the updated organization data
      console.log('✅ Organization updated successfully, fetching updated data...');
      return await this.getOrganizationById(data.id);
    }
    
    // Transform snake_case to camelCase
    const organization = {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logoUrl: orgData.logo_url,
      industry: orgData.industry,
      size: orgData.size,
      foundedYear: orgData.founded_year,
      isPublic: orgData.is_public,
      allowContact: orgData.allow_contact,
      isSponsor: orgData.is_sponsor,
      tags: orgData.tags || [],
      metadata: orgData.metadata || {},
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at,
    };
    
    console.log('✅ Organization updated:', organization);
    return organization;
  }

  // Delete organization
  static async deleteOrganization(organizationId: string): Promise<void> {
    console.log('Deleting organization:', { organizationId });
    
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      console.error('Error deleting organization:', error);
      throw new Error(`Failed to delete organization: ${error.message}`);
    }

    console.log('✅ Organization deleted');
  }

  // Get organization's assigned events
  static async getOrganizationEvents(organizationId: string): Promise<string[]> {
    console.log('Getting organization events:', { organizationId });
    
    const { data: eventsData, error } = await supabase
      .from('event_organizations')
      .select('event_id')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error getting organization events:', error);
      throw new Error(`Failed to get organization events: ${error.message}`);
    }

    if (!eventsData || eventsData.length === 0) {
      console.log('✅ No events found for organization');
      return [];
    }
    
    const eventIds = eventsData.map((item: any) => item.event_id);
    
    console.log('✅ Retrieved organization events:', eventIds);
    return eventIds;
  }

  // Assign organization to event
  static async assignOrganizationToEvent(organizationId: string, eventId: string): Promise<void> {
    console.log('Assigning organization to event:', { organizationId, eventId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_organizations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        organization_id: organizationId,
        event_id: eventId,
        role: 'sponsor',
        display_order: 0,
        is_confirmed: true,
        is_public: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error assigning organization to event:', errorText);
      throw new Error(`Failed to assign organization to event: ${errorText}`);
    }

    console.log('✅ Organization assigned to event');
  }

  // Unassign organization from event
  static async unassignOrganizationFromEvent(organizationId: string, eventId: string): Promise<void> {
    console.log('Unassigning organization from event:', { organizationId, eventId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_organizations?organization_id=eq.${organizationId}&event_id=eq.${eventId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning organization from event:', errorText);
      throw new Error(`Failed to unassign organization from event: ${errorText}`);
    }

    console.log('✅ Organization unassigned from event');
  }

  // Get organization's assigned activities
  static async getOrganizationActivities(organizationId: string): Promise<string[]> {
    console.log('Getting organization activities:', { organizationId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_organizations?organization_id=eq.${organizationId}&select=activity_id`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting organization activities:', errorText);
      throw new Error(`Failed to get organization activities: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get organization activities response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No activities found for organization (empty response)');
      return [];
    }
    
    const activityData = JSON.parse(responseText);
    const activityIds = activityData.map((item: any) => item.activity_id);
    
    console.log('✅ Retrieved organization activities:', activityIds);
    return activityIds;
  }

  // Assign organization to activity
  static async assignOrganizationToActivity(organizationId: string, activityId: string): Promise<void> {
    console.log('Assigning organization to activity:', { organizationId, activityId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_organizations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        organization_id: organizationId,
        activity_id: activityId,
        role: 'sponsor',
        display_order: 0,
        is_confirmed: true,
        is_public: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error assigning organization to activity:', errorText);
      throw new Error(`Failed to assign organization to activity: ${errorText}`);
    }

    console.log('✅ Organization assigned to activity');
  }

  // Unassign organization from activity
  static async unassignOrganizationFromActivity(organizationId: string, activityId: string): Promise<void> {
    console.log('Unassigning organization from activity:', { organizationId, activityId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_organizations?organization_id=eq.${organizationId}&activity_id=eq.${activityId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning organization from activity:', errorText);
      throw new Error(`Failed to unassign organization from activity: ${errorText}`);
    }

    console.log('✅ Organization unassigned from activity');
  }

  // Bulk assign organization to multiple activities
  static async assignOrganizationToActivities(organizationId: string, activityIds: string[]): Promise<void> {
    console.log('Bulk assigning organization to activities:', { organizationId, activityIds });
    
    // First, remove existing assignments for this organization
    await this.unassignOrganizationFromAllActivities(organizationId);
    
    // Then assign to new activities
    const assignments = activityIds.map(activityId => ({
      organization_id: organizationId,
      activity_id: activityId,
      role: 'sponsor',
      display_order: 0,
      is_confirmed: true,
      is_public: true,
    }));

    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_organizations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(assignments),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error bulk assigning organization to activities:', errorText);
      throw new Error(`Failed to bulk assign organization to activities: ${errorText}`);
    }

    console.log('✅ Organization bulk assigned to activities');
  }

  // Unassign organization from all activities
  static async unassignOrganizationFromAllActivities(organizationId: string): Promise<void> {
    console.log('Unassigning organization from all activities:', { organizationId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_organizations?organization_id=eq.${organizationId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning organization from all activities:', errorText);
      throw new Error(`Failed to unassign organization from all activities: ${errorText}`);
    }

    console.log('✅ Organization unassigned from all activities');
  }
}
