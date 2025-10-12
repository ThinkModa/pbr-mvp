import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Environment-aware Supabase configuration
const getSupabaseConfig = () => {
  // Priority: Vite environment variables > fallback
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
    'https://zqjziejllixifpwzbdnf.supabase.co';
    
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';
    
  const appEnv = import.meta.env.VITE_APP_ENV || 'staging';
  
  console.log(`🔧 Web Admin Supabase Config - Environment: ${appEnv}, URL: ${supabaseUrl}`);
  
  return { supabaseUrl, supabaseAnonKey, appEnv };
};

const { supabaseUrl, supabaseAnonKey, appEnv } = getSupabaseConfig();

// Create Supabase client for web admin
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get service role client for admin operations
export const getServiceRoleClient = () => {
  // Environment-aware service role key
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Export current environment for debugging
export const currentEnvironment = appEnv;
