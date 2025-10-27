#!/usr/bin/env node

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });

  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : [];
}

async function registerTestPushTokens() {
  console.log('🔧 Registering test push tokens for users...');

  try {
    // Get users
    const users = await supabaseRequest('users?select=id,name,email');
    console.log(`Found ${users.length} users`);

    // Create test push tokens for each user
    for (const user of users) {
      // Generate a fake Expo push token for testing
      const testToken = `ExponentPushToken[${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}]`;
      
      try {
        await supabaseRequest('user_push_tokens', {
          method: 'POST',
          body: JSON.stringify({
            user_id: user.id,
            push_token: testToken,
            platform: 'ios', // or 'android'
            is_active: true
          })
        });
        console.log(`✅ Registered push token for ${user.name} (${user.email})`);
      } catch (error) {
        console.log(`⚠️ Could not register token for ${user.name}: ${error.message}`);
      }
    }

    // Check registered tokens
    const tokens = await supabaseRequest('user_push_tokens?select=*');
    console.log(`\n📱 Total push tokens registered: ${tokens.length}`);
    tokens.forEach(token => {
      console.log(`  - User: ${token.user_id}, Token: ${token.push_token.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('❌ Error registering push tokens:', error.message);
  }
}

registerTestPushTokens().catch(console.error);
