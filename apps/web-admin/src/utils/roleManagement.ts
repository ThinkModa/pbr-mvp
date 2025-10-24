import { getServiceRoleClient, supabase } from '../lib/supabase';
// import { Database } from '../../../../packages/database/src/types';

const serviceRoleSupabase = getServiceRoleClient();

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: 'admin' | 'business' | 'general';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface RoleChangeResult {
  success: boolean;
  error?: string;
  oldRole?: string;
  newRole?: string;
}

export interface RoleHistoryEntry {
  id: string;
  old_role: string;
  new_role: string;
  changed_by_name: string;
  reason: string | null;
  created_at: string;
}

export const roleManagement = {
  /**
   * Get all users with their current roles
   */
  async getAllUsersWithRoles(): Promise<{ success: boolean; users: UserWithRole[]; error?: string }> {
    try {
      console.log('🔧 roleManagement.getAllUsersWithRoles() called');
      const { data, error } = await serviceRoleSupabase.rpc('get_all_users_with_roles');
      
      if (error) {
        console.error('❌ Error fetching users with roles:', error);
        return { success: false, users: [], error: error.message };
      }
      
      console.log('✅ Users fetched successfully:', data?.length || 0);
      return { success: true, users: data || [] };
    } catch (error: any) {
      console.error('💥 Role management error:', error);
      return { success: false, users: [], error: error.message };
    }
  },

  /**
   * Change a user's role
   */
  async changeUserRole(
    userId: string, 
    newRole: 'admin' | 'business' | 'general',
    changedByUserId: string,
    reason?: string
  ): Promise<RoleChangeResult> {
    try {
      const { data, error } = await serviceRoleSupabase.rpc('change_user_role', {
        target_user_id: userId,
        new_role: newRole,
        changed_by_user_id: changedByUserId,
        reason: reason || null
      });
      
      if (error) {
        console.error('Error changing user role:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, newRole };
    } catch (error: any) {
      console.error('Role change error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get role change history for a user
   */
  async getUserRoleHistory(userId: string): Promise<{ success: boolean; history: RoleHistoryEntry[]; error?: string }> {
    try {
      const { data, error } = await serviceRoleSupabase.rpc('get_user_role_history', {
        target_user_id: userId
      });
      
      if (error) {
        console.error('Error fetching role history:', error);
        return { success: false, history: [], error: error.message };
      }
      
      return { success: true, history: data || [] };
    } catch (error: any) {
      console.error('Role history error:', error);
      return { success: false, history: [], error: error.message };
    }
  },

  /**
   * Get current user's role (for permission checks)
   */
  async getCurrentUserRole(): Promise<{ success: boolean; role?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching current user role:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, role: data?.role };
    } catch (error: any) {
      console.error('Current user role error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    const result = await this.getCurrentUserRole();
    return result.success && result.role === 'admin';
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string, deletedByUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, check if the user exists and get their details
      const { data: userToDelete, error: fetchError } = await serviceRoleSupabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (fetchError || !userToDelete) {
        return { success: false, error: 'User not found' };
      }

      // Prevent deleting the last admin
      if (userToDelete.role === 'admin') {
        const { data: adminCount, error: countError } = await serviceRoleSupabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'admin')
          .eq('is_active', true);

        if (countError) {
          return { success: false, error: 'Failed to check admin count' };
        }

        if (adminCount && adminCount.length <= 1) {
          return { success: false, error: 'Cannot delete the last admin user' };
        }
      }

      // Delete user from auth (this will cascade to users table due to foreign key)
      const { error: authError } = await serviceRoleSupabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting user from auth:', authError);
        return { success: false, error: `Failed to delete user: ${authError.message}` };
      }

      console.log(`✅ User ${userToDelete.email} deleted successfully by admin`);
      return { success: true };
    } catch (error: any) {
      console.error('User deletion error:', error);
      return { success: false, error: error.message };
    }
  }
};
