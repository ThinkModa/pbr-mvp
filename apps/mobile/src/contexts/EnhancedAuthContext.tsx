import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '../services/authService';
import { ConditionalRoleSubscription } from '../components/ConditionalRoleSubscription';

// Configuration flag to enable/disable real auth
// Set to true to enable real Supabase auth, false for mock auth (recommended for Expo Go)
const USE_REAL_AUTH = false; // Set to true to enable real Supabase auth

// User type (compatible with both mock and real auth)
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
  // Authentication state
  user: User | null;
  loading: boolean;
  
  // Authentication methods
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
  
  // User management
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time role subscription - only enabled when using real auth
  // We'll handle this with a separate component to avoid conditional hook calls

  // Initialize auth state
  useEffect(() => {
    if (USE_REAL_AUTH) {
      // TODO: Check for existing session in real auth
      setLoading(false);
    } else {
      // Simulate loading on app start (mock behavior)
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sign up
  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }) => {
    if (USE_REAL_AUTH) {
      // Use real Supabase authentication
      const result = await authService.signUp(email, password, userData);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { error: null };
      } else {
        return { error: result.error || 'Signup failed' };
      }
    } else {
      // Mock authentication with provided role
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use role from signup form
      let userId = '33333333-3333-3333-3333-333333333333'; // Default general
      if (userData.role === 'business') {
        userId = '22222222-2222-2222-2222-222222222222'; // Business user
      }
      
      const newUser: User = {
        id: userId,
        email,
        name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        is_active: true,
      };
      
      setUser(newUser);
      return { error: null };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    if (USE_REAL_AUTH) {
      // Use real Supabase authentication
      const result = await authService.signIn(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { error: null };
      } else {
        return { error: result.error || 'Login failed' };
      }
    } else {
      // Mock authentication with role detection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Determine role and user ID based on email
      let role: 'admin' | 'business' | 'general' = 'general';
      let userId = '33333333-3333-3333-3333-333333333333'; // Default general user
      let userName = email.split('@')[0];
      
      // Check email patterns for role assignment
      if (email.includes('admin') || email.endsWith('@admin.com')) {
        role = 'admin';
        userId = '11111111-1111-1111-1111-111111111111'; // Admin user from DB
        userName = 'Admin User';
      } else if (email.includes('business') || email.endsWith('@business.com')) {
        role = 'business';
        userId = '22222222-2222-2222-2222-222222222222'; // Business user from DB
        userName = 'Business User';
      }
      
      const mockUser: User = {
        id: userId,
        email,
        name: userName,
        role,
        is_active: true,
      };
      
      setUser(mockUser);
      return { error: null };
    }
  };

  // Google sign in
  const signInWithGoogle = async () => {
    if (USE_REAL_AUTH) {
      // TODO: Implement Google OAuth
      return { error: { message: 'Google sign-in not implemented yet' } };
    } else {
      // Use mock authentication (existing behavior)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'user@pbr.com',
        name: 'General User',
        role: 'general',
        is_active: true,
      };
      
      setUser(mockUser);
      return { error: null };
    }
  };

  // Sign out
  const signOut = async () => {
    if (USE_REAL_AUTH) {
      const result = await authService.signOut();
      if (result.success) {
        setUser(null);
        return { error: null };
      } else {
        return { error: result.error || 'Signout failed' };
      }
    } else {
      // Use mock authentication (existing behavior)
      setUser(null);
      return { error: null };
    }
  };

  // Refresh user
  const refreshUser = async () => {
    if (USE_REAL_AUTH && user) {
      const refreshedUser = await authService.refreshUser(user.id);
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } else {
      // Mock behavior
      console.log('Refreshing user data...');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Only render real-time subscription when using real auth */}
      {USE_REAL_AUTH && user?.id && (
        <ConditionalRoleSubscription
          userId={user.id}
          onRoleChange={(newRole) => {
            console.log('🔄 Role changed to:', newRole);
            if (user) {
              setUser(prevUser => prevUser ? { ...prevUser, role: newRole } : null);
              // Show a notification to the user
              alert(`Your role has been updated to: ${newRole}`);
            }
          }}
          onError={(error) => {
            console.error('❌ Role subscription error:', error);
          }}
        />
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
