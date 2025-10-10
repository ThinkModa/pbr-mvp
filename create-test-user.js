const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://zqjziejllixifpwzbdnf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test admin user...');
    
    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: 'Test Admin',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created:', authData.user?.email);

    // Create user profile in public.users
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: 'Test Admin',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('Profile created:', profileData);
    console.log('\n✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123456');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();

