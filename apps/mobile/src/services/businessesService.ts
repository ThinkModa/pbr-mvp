import { supabase } from '../lib/supabase';
export interface Business {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  logoUrl?: string;
  coverImageUrl?: string;
  galleryUrls: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  foundedYear?: number;
  employeeCount?: number;
  revenue?: string;
  services: string[];
  products: string[];
  isPublic: boolean;
  allowContact: boolean;
  isSponsor: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessContact {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  role: string;
  isPrimary: boolean;
  isPublic: boolean;
  allowContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventBusiness {
  id: string;
  eventId: string;
  businessId: string;
  role: string;
  sponsorshipLevel?: string;
  boothNumber?: string;
  displayOrder: number;
  isFeatured: boolean;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  business?: Business;
  contacts?: BusinessContact[];
}

export class BusinessesService {


  // Get all businesses for an event
  static async getEventBusinesses(eventId: string): Promise<EventBusiness[]> {
    console.log('Getting event businesses:', { eventId });
    
    const { data: eventBusinesses, error } = await supabase
      .from('event_businesses')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error getting event businesses:', error);
      throw new Error(`Failed to get event businesses: ${error.message}`);
    }

    console.log('✅ Retrieved event businesses:', eventBusinesses.length);

    // Fetch business details and contacts for each event business
    const businessesWithDetails = await Promise.all(
      eventBusinesses.map(async (eventBusiness: any) => {
        try {
          const business = await this.getBusinessById(eventBusiness.business_id);
          const contacts = await this.getBusinessContacts(eventBusiness.business_id);
          return { ...eventBusiness, business, contacts };
        } catch (error) {
          console.error('Error fetching business details:', error);
          return eventBusiness;
        }
      })
    );

    return businessesWithDetails;
  }

  // Get business by ID
  static async getBusinessById(businessId: string): Promise<Business> {
    console.log('Getting business by ID:', { businessId });
    
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('is_public', true);

    if (error) {
      console.error('Error getting business:', error);
      throw new Error(`Failed to get business: ${error.message}`);
    }

    if (!businesses || businesses.length === 0) {
      throw new Error('Business not found');
    }
    
    console.log('✅ Retrieved business:', businesses[0]);
    return businesses[0];
  }

  // Get business contacts
  static async getBusinessContacts(businessId: string): Promise<BusinessContact[]> {
    console.log('Getting business contacts:', { businessId });
    
    const { data: contacts, error } = await supabase
      .from('business_contacts')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_public', true)
      .order('is_primary', { ascending: false })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error getting business contacts:', error);
      throw new Error(`Failed to get business contacts: ${error.message}`);
    }

    console.log('✅ Retrieved business contacts:', contacts.length);
    return contacts || [];
  }

  // Get all public businesses (for admin selection)
  static async getAllBusinesses(): Promise<Business[]> {
    console.log('Getting all businesses');
    
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_public', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting all businesses:', error);
      throw new Error(`Failed to get all businesses: ${error.message}`);
    }

    console.log('✅ Retrieved all businesses:', businesses.length);
    return businesses || [];
  }
}
