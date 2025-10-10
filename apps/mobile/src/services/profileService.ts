// Real profile service that uses centralized Supabase client
// This ensures consistent database configuration across all services
//
// CRITICAL RULE: Test environment must ALWAYS use live database data, never mock data.
// This ensures real-time sync between desktop admin and mobile app for true integration testing.

import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tShirtSize?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  bio?: string;
  organizationAffiliation?: string;
  titlePosition?: string;
  points: number;
  avatarUrl?: string;
  professionalCategories: ProfessionalCategory[];
  communityInterests: CommunityInterest[];
  eventHistory: EventAttendance[];
}

export interface ProfessionalCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface CommunityInterest {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  eventTitle: string;
  attendedAt: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  tShirtSize?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  bio?: string;
  organizationAffiliation?: string;
  titlePosition?: string;
  avatarUrl?: string;
}

export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export class ProfileService {

  /**
   * Get user profile with all related data
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      console.log('Getting user profile:', { userId });

      // Get user basic info
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      if (!users) {
        throw new Error('User not found');
      }

      const user = users;

      // Get professional categories
      const professionalCategories = await this.getUserProfessionalCategories(userId);

      // Get community interests
      const communityInterests = await this.getUserCommunityInterests(userId);

      // Get event history
      const eventHistory = await this.getUserEventHistory(userId);

      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number,
        tShirtSize: user.t_shirt_size,
        dietaryRestrictions: user.dietary_restrictions,
        accessibilityNeeds: user.accessibility_needs,
        bio: user.bio,
        organizationAffiliation: user.organization_affiliation,
        titlePosition: user.title_position,
        points: user.points || 0,
        avatarUrl: user.avatar_url,
        professionalCategories,
        communityInterests,
        eventHistory,
      };

      console.log('✅ Retrieved user profile:', { userId, profile });
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      console.log('Updating user profile:', { userId, data });

      // Map camelCase field names to snake_case for database
      const dbData: any = {};
      if (data.firstName !== undefined) dbData.first_name = data.firstName;
      if (data.lastName !== undefined) dbData.last_name = data.lastName;
      if (data.email !== undefined) dbData.email = data.email;
      if (data.phoneNumber !== undefined) dbData.phone_number = data.phoneNumber;
      if (data.tShirtSize !== undefined) dbData.t_shirt_size = data.tShirtSize;
      if (data.dietaryRestrictions !== undefined) dbData.dietary_restrictions = data.dietaryRestrictions;
      if (data.accessibilityNeeds !== undefined) dbData.accessibility_needs = data.accessibilityNeeds;
      if (data.bio !== undefined) dbData.bio = data.bio;
      if (data.organizationAffiliation !== undefined) dbData.organization_affiliation = data.organizationAffiliation;
      if (data.titlePosition !== undefined) dbData.title_position = data.titlePosition;
      if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;

      console.log('Updating user profile with data:', dbData);
      
      const { error } = await supabase
        .from('users')
        .update(dbData)
        .eq('id', userId);

      if (error) {
        console.error('Update error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('✅ Updated user profile:', { userId });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get all available professional categories
   */
  static async getProfessionalCategories(): Promise<ProfessionalCategory[]> {
    try {
      const { data: categories, error } = await supabase
        .from('professional_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch professional categories: ${error.message}`);
      }
      console.log('✅ Retrieved professional categories:', categories.length);
      return categories;
    } catch (error) {
      console.error('Error getting professional categories:', error);
      throw error;
    }
  }

  /**
   * Get all available community interests
   */
  static async getCommunityInterests(): Promise<CommunityInterest[]> {
    try {
      const { data: interests, error } = await supabase
        .from('community_interests')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch community interests: ${error.message}`);
      }
      console.log('✅ Retrieved community interests:', interests.length);
      return interests;
    } catch (error) {
      console.error('Error getting community interests:', error);
      throw error;
    }
  }

  /**
   * Get user's professional categories
   */
  static async getUserProfessionalCategories(userId: string): Promise<ProfessionalCategory[]> {
    try {
      const { data, error } = await supabase
        .from('user_professional_categories')
        .select('professional_categories(*)')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch user professional categories: ${error.message}`);
      }

      const categories = data.map((item: any) => item.professional_categories).filter(Boolean);
      console.log('✅ Retrieved user professional categories:', categories.length);
      return categories;
    } catch (error) {
      console.error('Error getting user professional categories:', error);
      return [];
    }
  }

  /**
   * Get user's community interests
   */
  static async getUserCommunityInterests(userId: string): Promise<CommunityInterest[]> {
    try {
      const { data, error } = await supabase
        .from('user_community_interests')
        .select('community_interests(*)')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch user community interests: ${error.message}`);
      }

      const interests = data.map((item: any) => item.community_interests).filter(Boolean);
      console.log('✅ Retrieved user community interests:', interests.length);
      return interests;
    } catch (error) {
      console.error('Error getting user community interests:', error);
      return [];
    }
  }

  /**
   * Get user's event attendance history
   */
  static async getUserEventHistory(userId: string): Promise<EventAttendance[]> {
    try {
      const { data, error } = await supabase
        .from('user_event_attendance')
        .select('*, events(title)')
        .eq('user_id', userId)
        .order('attended_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user event history: ${error.message}`);
      }
      const history = data.map((item: any) => ({
        id: item.id,
        eventId: item.event_id,
        eventTitle: item.events?.title || 'Unknown Event',
        attendedAt: item.attended_at,
        checkInTime: item.check_in_time,
        checkOutTime: item.check_out_time,
      }));
      console.log('✅ Retrieved user event history:', history.length);
      return history;
    } catch (error) {
      console.error('Error getting user event history:', error);
      return [];
    }
  }

  /**
   * Update user's professional categories
   */
  static async updateUserProfessionalCategories(userId: string, categoryIds: string[]): Promise<void> {
    try {
      console.log('Updating user professional categories:', { userId, categoryIds });

      // First, remove existing categories
      const { error: deleteError } = await supabase
        .from('user_professional_categories')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Failed to delete existing professional categories: ${deleteError.message}`);
      }

      // Then, add new categories
      if (categoryIds.length > 0) {
        const categoriesToInsert = categoryIds.map(categoryId => ({
          user_id: userId,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from('user_professional_categories')
          .insert(categoriesToInsert);

        if (insertError) {
          throw new Error(`Failed to update professional categories: ${insertError.message}`);
        }
      }

      console.log('✅ Updated user professional categories:', { userId, categoryIds });
    } catch (error) {
      console.error('Error updating user professional categories:', error);
      throw error;
    }
  }

  /**
   * Update user's community interests
   */
  static async updateUserCommunityInterests(userId: string, interestIds: string[]): Promise<void> {
    try {
      console.log('Updating user community interests:', { userId, interestIds });

      // First, remove existing interests
      const { error: deleteError } = await supabase
        .from('user_community_interests')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Failed to delete existing community interests: ${deleteError.message}`);
      }

      // Then, add new interests
      if (interestIds.length > 0) {
        const interestsToInsert = interestIds.map(interestId => ({
          user_id: userId,
          interest_id: interestId,
        }));

        const { error: insertError } = await supabase
          .from('user_community_interests')
          .insert(interestsToInsert);

        if (insertError) {
          throw new Error(`Failed to update community interests: ${insertError.message}`);
        }
      }

      console.log('✅ Updated user community interests:', { userId, interestIds });
    } catch (error) {
      console.error('Error updating user community interests:', error);
      throw error;
    }
  }

  /**
   * Upload profile image to Supabase Storage
   */
  static async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('Uploading profile image:', { userId, imageUri });

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, `profile-${userId}-${Date.now()}.jpg`);

      // Upload to Supabase Storage
      const uploadResponse = await fetch(
        `${this.SUPABASE_URL}/storage/v1/object/profile-images/profile-${userId}-${Date.now()}.jpg`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`);
      }

      const imageUrl = `${this.SUPABASE_URL}/storage/v1/object/public/profile-images/profile-${userId}-${Date.now()}.jpg`;
      console.log('✅ Uploaded profile image:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  /**
   * Check if user profile is complete for RSVP eligibility
   * Required fields: first_name, last_name, phone, email, t_shirt_size, dietary_restrictions, accessibility_needs
   */
  static async checkProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
    try {
      console.log('Checking profile completeness:', { userId });

      const profile = await this.getUserProfile(userId);
      
      // Define required fields for RSVP
      const requiredFields = [
        { key: 'firstName', label: 'First Name', value: profile.firstName },
        { key: 'lastName', label: 'Last Name', value: profile.lastName },
        { key: 'phoneNumber', label: 'Phone Number', value: profile.phoneNumber },
        { key: 'email', label: 'Email', value: profile.email },
        { key: 'tShirtSize', label: 'T-Shirt Size', value: profile.tShirtSize },
        { key: 'dietaryRestrictions', label: 'Dietary Restrictions', value: profile.dietaryRestrictions },
        { key: 'accessibilityNeeds', label: 'Accessibility Needs', value: profile.accessibilityNeeds },
      ];

      const missingFields: string[] = [];
      
      for (const field of requiredFields) {
        // Check if string fields are not empty or null
        if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
          missingFields.push(field.label);
        }
      }

      const isComplete = missingFields.length === 0;
      const completionPercentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

      const result: ProfileCompleteness = {
        isComplete,
        missingFields,
        completionPercentage,
      };

      console.log('✅ Profile completeness check:', result);
      return result;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      throw error;
    }
  }

}
