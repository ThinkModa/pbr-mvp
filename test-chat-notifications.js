#!/usr/bin/env node

/**
 * Test Chat Message Notifications
 * 
 * This script tests the chat message notification system by sending a test message
 * and verifying that it triggers push notifications.
 */

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

async function testChatNotifications() {
  console.log('💬 Testing Chat Message Notifications...\n');

  try {
    // 1. Get users with push tokens
    console.log('📋 Step 1: Getting users with push tokens...');
    const pushTokens = await supabaseRequest('user_push_tokens?select=*');
    if (pushTokens.length < 2) {
      console.log('❌ Need at least 2 users with push tokens for chat testing.');
      return;
    }
    console.log(`✅ Found ${pushTokens.length} push tokens`);

    // 2. Get the existing DM thread between Chevy Chase and Shakori Walton
    console.log('\n📋 Step 2: Finding existing DM thread...');
    const dmThreads = await supabaseRequest('chat_threads?type=eq.dm&select=id,name,chat_memberships(user_id,users!chat_memberships_user_id_fkey(name,email))');
    
    let testThread = null;
    for (const thread of dmThreads) {
      if (thread.chat_memberships && thread.chat_memberships.length >= 2) {
        testThread = thread;
        break;
      }
    }
    
    if (!testThread) {
      console.log('❌ No suitable DM thread found for testing.');
      return;
    }
    
    console.log(`✅ Found DM thread: ${testThread.id}`);
    console.log(`   Members: ${testThread.chat_memberships.map(m => m.users.name).join(', ')}`);

    // 3. Send a test message
    console.log('\n📋 Step 3: Sending test chat message...');
    const sender = testThread.chat_memberships[0];
    const testMessage = await supabaseRequest('chat_messages', {
      method: 'POST',
      body: JSON.stringify({
        thread_id: testThread.id,
        user_id: sender.user_id,
        content: 'Test chat message notification! 🔔 This should trigger a push notification.',
        message_type: 'text'
      })
    });
    console.log('✅ Test message sent:', testMessage);

    // 4. Check if notification was created
    console.log('\n📋 Step 4: Checking for chat notification...');
    const notifications = await supabaseRequest('notifications?type=eq.chat_message&order=created_at.desc&limit=1&select=*');
    if (notifications.length === 0) {
      console.log('❌ No chat notification found.');
      return;
    }
    const notification = notifications[0];
    console.log(`✅ Chat notification created: ${notification.title}`);
    console.log(`   Content: ${notification.content}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Created: ${notification.created_at}`);

    // 5. Check if user notifications were created
    console.log('\n📋 Step 5: Verifying user notifications...');
    const userNotifications = await supabaseRequest(`user_notifications?notification_id=eq.${notification.id}&select=*`);
    console.log(`✅ Found ${userNotifications.length} user notifications assigned`);

    console.log('\n🎉 Chat notification test completed!');
    console.log('\n📱 Check your mobile devices for push notifications!');
    console.log('   - The chat message should trigger a push notification');
    console.log('   - Tapping it should open the app and navigate to the chat');

  } catch (error) {
    console.error('❌ Error testing chat notifications:', error.message);
    process.exit(1);
  }
}

// Run the test
testChatNotifications().catch(console.error);
