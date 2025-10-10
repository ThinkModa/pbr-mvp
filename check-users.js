const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://zqjziejllixifpwzbdnf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  try {
    console.log('Checking auth users...');
    
    // Check auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('\n📧 Auth Users:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });

    // Check public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');

    if (publicError) {
      console.error('Public users error:', publicError);
      return;
    }

    console.log('\n👥 Public Users:');
    publicUsers.forEach(user => {
      console.log(`- ${user.email} (Role: ${user.role}) - Active: ${user.is_active}`);
    });

    console.log('\n🔑 Test Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: test123456');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();