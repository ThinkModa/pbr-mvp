import { supabase, getServiceRoleClient } from '../lib/supabase';

// User type matching our database schema
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'business' | 'general';
  avatar_url?: string;
  is_active: boolean;
  preferences?: any;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// Promote a user to admin role
export const promoteUserToAdmin = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const serviceClient = getServiceRoleClient();
    
    const { data, error } = await serviceClient.rpc('promote_user_to_admin', {
      user_id: userId
    });

    if (error) {
      console.error('Error promoting user to admin:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'User not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in promoteUserToAdmin:', error);
    return { success: false, error: 'Failed to promote user' };
  }
};

// Demote an admin to general user
export const demoteAdminToUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const serviceClient = getServiceRoleClient();
    
    const { data, error } = await serviceClient.rpc('demote_admin_to_user', {
      user_id: userId
    });

    if (error) {
      console.error('Error demoting admin to user:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'User not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in demoteAdminToUser:', error);
    return { success: false, error: 'Failed to demote user' };
  }
};

// List all users (admin only)
export const listAllUsers = async (): Promise<{ users: User[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { users: [], error: error.message };
    }

    return { users: data as User[] };
  } catch (error) {
    console.error('Error in listAllUsers:', error);
    return { users: [], error: 'Failed to fetch users' };
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<{ user: User | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return { user: null, error: error.message };
    }

    return { user: data as User };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return { user: null, error: 'Failed to fetch user' };
  }
};

// Update user profile (admin only)
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Pick<User, 'name' | 'email' | 'role' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: 'Failed to update user profile' };
  }
};

// Get user statistics
export const getUserStats = async (): Promise<{ 
  totalUsers: number; 
  adminUsers: number; 
  businessUsers: number; 
  generalUsers: number;
  activeUsers: number;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, is_active');

    if (error) {
      console.error('Error fetching user stats:', error);
      return { 
        totalUsers: 0, 
        adminUsers: 0, 
        businessUsers: 0, 
        generalUsers: 0,
        activeUsers: 0,
        error: error.message 
      };
    }

    const stats = data.reduce((acc, user) => {
      acc.totalUsers++;
      if (user.is_active) acc.activeUsers++;
      
      switch (user.role) {
        case 'admin':
          acc.adminUsers++;
          break;
        case 'business':
          acc.businessUsers++;
          break;
        case 'general':
          acc.generalUsers++;
          break;
      }
      
      return acc;
    }, {
      totalUsers: 0,
      adminUsers: 0,
      businessUsers: 0,
      generalUsers: 0,
      activeUsers: 0
    });

    return stats;
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { 
      totalUsers: 0, 
      adminUsers: 0, 
      businessUsers: 0, 
      generalUsers: 0,
      activeUsers: 0,
      error: 'Failed to fetch user statistics' 
    };
  }
};
