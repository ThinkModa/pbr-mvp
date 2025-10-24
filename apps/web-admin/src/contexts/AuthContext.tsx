import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'business' | 'general';
  avatar_url?: string;
  is_active?: boolean;
  preferences?: any;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from public.users table
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading user profile for ID:', userId);
      
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading user profile:', error);
        return;
      }

      if (userProfile) {
        console.log('📊 User profile loaded:', userProfile.email, 'Role:', userProfile.role);
        console.log('🕒 Profile updated at:', userProfile.updated_at);
        
        // Check if we need to update the user (compare timestamps)
        const currentUser = user;
        const shouldUpdate = !currentUser || 
          !currentUser.updated_at || 
          new Date(userProfile.updated_at) > new Date(currentUser.updated_at);
        
        if (shouldUpdate) {
          console.log('🔄 Updating user data (database is newer or first load)');
          const updatedUser: User = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role as 'admin' | 'business' | 'general',
            avatar_url: userProfile.avatar_url,
            is_active: userProfile.is_active,
            preferences: userProfile.preferences,
            last_login_at: userProfile.last_login_at,
            created_at: userProfile.created_at,
            updated_at: userProfile.updated_at,
          };
          setUser(updatedUser);
          console.log('✅ User data updated successfully');
        } else {
          console.log('ℹ️ User data is up to date, no update needed');
        }
      }
    } catch (error) {
      console.error('💥 Error in loadUserProfile:', error);
    }
  };

  // Refresh user with improved error handling and logging
  const refreshUser = async () => {
    try {
      console.log('🔄 Starting user refresh...');
      const { data: { user: supabaseUser }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.error('❌ Error getting user for refresh:', getUserError);
        return;
      }
      
      if (supabaseUser) {
        console.log('👤 Refreshing profile for user:', supabaseUser.email);
        await loadUserProfile(supabaseUser.id);
        console.log('✅ User refresh completed');
      } else {
        console.log('⚠️ No user found during refresh');
        setUser(null);
      }
    } catch (error) {
      console.error('💥 Refresh user error:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Found existing session, loading profile for:', session.user.email);
          await loadUserProfile(session.user.id);
        } else {
          console.log('ℹ️ No existing session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading profile...');
        setLoading(true);
        await loadUserProfile(session.user.id);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed, ensuring profile is loaded...');
        if (!user) {
          await loadUserProfile(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to user profile changes for real-time role updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 Setting up real-time subscription for user:', user.id);

    const subscription = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔔 User profile updated:', payload);
          console.log('🔄 Refreshing user data due to profile change...');
          // Force refresh user data when profile changes
          await refreshUser();
        }
      )
      .subscribe((status) => {
        console.log('📡 User profile subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to user profile changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to user profile changes');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from user profile changes');
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An error occurred during sign in' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
