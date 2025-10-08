import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Mock user type
interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'business' | 'general';
}

interface MockAuthContextType {
  // Authentication state
  user: MockUser | null;
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

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

interface MockAuthProviderProps {
  children: ReactNode;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading on app start
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mock sign up
  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock user with proper UUID format
    const newUser: MockUser = {
      id: '33333333-3333-3333-3333-333333333333', // Existing user ID from database
      email,
      name: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
    };
    
    setUser(newUser);
    return { error: null };
  };

  // Mock sign in
  const signIn = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock user (in real app, this would validate credentials)
    const mockUser: MockUser = {
      id: '33333333-3333-3333-3333-333333333333', // Existing user ID from database
      email,
      name: 'Admin User', // This would come from the database
      role: 'admin',
    };
    
    setUser(mockUser);
    return { error: null };
  };

  // Mock Google sign in
  const signInWithGoogle = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: MockUser = {
      id: '33333333-3333-3333-3333-333333333333', // Existing user ID from database
      email: 'user@pbr.com',
      name: 'Admin User',
      role: 'admin',
    };
    
    setUser(mockUser);
    return { error: null };
  };

  // Mock sign out
  const signOut = async () => {
    setUser(null);
    return { error: null };
  };

  // Mock refresh user
  const refreshUser = async () => {
    // In a real app, this would fetch fresh user data
    console.log('Refreshing user data...');
  };

  const value: MockAuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Custom hook to use mock auth context
export const useAuth = (): MockAuthContextType => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
};
