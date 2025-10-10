import { supabase } from '../lib/supabase';
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

export interface EventOrganization {
  id: string;
  eventId: string;
  organizationId: string;
  role: string;
  sponsorshipLevel?: string;
  boothNumber?: string;
  displayOrder: number;
  isFeatured: boolean;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
}

export class OrganizationsService {


  // Transform snake_case to camelCase
  private static transformOrganizationData(data: any): Organization {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      website: data.website,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logoUrl: data.logo_url,
      industry: data.industry,
      size: data.size,
      foundedYear: data.founded_year,
      isPublic: data.is_public,
      allowContact: data.allow_contact,
      isSponsor: data.is_sponsor,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Get all organizations for an event
  static async getEventOrganizations(eventId: string): Promise<EventOrganization[]> {
    console.log('Getting event organizations:', { eventId });
    
    const { data: eventOrganizations, error } = await supabase
      .from('event_organizations')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error getting event organizations:', error);
      throw new Error(`Failed to get event organizations: ${error.message}`);
    }

    console.log('✅ Retrieved event organizations:', eventOrganizations.length);

    // Fetch organization details for each event organization
    const organizationsWithDetails = await Promise.all(
      eventOrganizations.map(async (eventOrganization: any) => {
        try {
          const organization = await this.getOrganizationById(eventOrganization.organization_id);
          return { ...eventOrganization, organization };
        } catch (error) {
          console.error('Error fetching organization details:', error);
          return eventOrganization;
        }
      })
    );

    return organizationsWithDetails;
  }

  // Get organization by ID
  static async getOrganizationById(organizationId: string): Promise<Organization> {
    console.log('Getting organization by ID:', { organizationId });
    
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .eq('is_public', true);

    if (error) {
      console.error('Error getting organization:', error);
      throw new Error(`Failed to get organization: ${error.message}`);
    }

    if (!organizations || organizations.length === 0) {
      throw new Error('Organization not found');
    }
    
    const transformedOrganization = this.transformOrganizationData(organizations[0]);
    console.log('✅ Retrieved organization:', transformedOrganization);
    return transformedOrganization;
  }

  // Get all public organizations (for admin selection)
  static async getAllOrganizations(): Promise<Organization[]> {
    console.log('Getting all organizations');
    
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_public', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting all organizations:', error);
      throw new Error(`Failed to get all organizations: ${error.message}`);
    }

    const transformedOrganizations = organizations.map((org: any) => this.transformOrganizationData(org));
    console.log('✅ Retrieved all organizations:', transformedOrganizations.length);
    return transformedOrganizations;
  }
}
