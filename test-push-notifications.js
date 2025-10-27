#!/usr/bin/env node

/**
 * Test Push Notifications
 * 
 * This script tests the push notification system by creating a test notification
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

async function testPushNotifications() {
  console.log('🧪 Testing Push Notification System...\n');

  try {
    // 1. Check if we have users with push tokens
    console.log('📋 Step 1: Checking users with push tokens...');
    const pushTokens = await supabaseRequest('user_push_tokens?select=*');
    if (pushTokens.length === 0) {
      console.log('❌ No push tokens found. Users need to register push tokens first.');
      return;
    }
    console.log(`✅ Found ${pushTokens.length} push tokens:`);
    pushTokens.forEach(token => console.log(`  - User: ${token.user_id}, Token: ${token.push_token}`));

    // 2. Get the Know Us Atlanta 2025 event
    console.log('\n📋 Step 2: Getting Know Us Atlanta 2025 event...');
    const events = await supabaseRequest('events?title=eq.Know Us: Atlanta 2025&select=id,title');
    if (events.length === 0) {
      console.log('❌ Know Us Atlanta 2025 event not found.');
      return;
    }
    const event = events[0];
    console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);

    // 3. Get users who are RSVP'd to the event
    console.log('\n📋 Step 3: Getting RSVP\'d users...');
    const rsvps = await supabaseRequest(`event_rsvps?event_id=eq.${event.id}&status=eq.attending&select=user_id,users!event_rsvps_user_id_fkey(name,email)`);
    if (rsvps.length === 0) {
      console.log('❌ No users RSVP\'d to the event.');
      return;
    }
    console.log(`✅ Found ${rsvps.length} RSVP\'d users:`);
    rsvps.forEach(rsvp => console.log(`  - ${rsvp.users.name} (${rsvp.users.email})`));

    // 4. Create a test notification using the send_notification_to_rsvps function
    console.log('\n📋 Step 4: Creating test notification...');
    const testNotification = await supabaseRequest('rpc/send_notification_to_rsvps', {
      method: 'POST',
      body: JSON.stringify({
        p_event_id: event.id,
        p_title: 'Test Push Notification',
        p_content: 'This is a test push notification to verify the system is working! 🎉',
        p_created_by: rsvps[0].user_id // Use first RSVP'd user as creator
      })
    });
    console.log('✅ Test notification created:', testNotification);

    // 5. Check if the notification was created
    console.log('\n📋 Step 5: Verifying notification was created...');
    const notifications = await supabaseRequest(`notifications?event_id=eq.${event.id}&order=created_at.desc&limit=1&select=*`);
    if (notifications.length === 0) {
      console.log('❌ No notifications found.');
      return;
    }
    const notification = notifications[0];
    console.log(`✅ Notification created: ${notification.title}`);
    console.log(`   Content: ${notification.content}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Created: ${notification.created_at}`);

    // 6. Check if user notifications were created
    console.log('\n📋 Step 6: Verifying user notifications...');
    const userNotifications = await supabaseRequest(`user_notifications?notification_id=eq.${notification.id}&select=*`);
    console.log(`✅ Found ${userNotifications.length} user notifications assigned`);

    // 7. Check if chat thread was created
    console.log('\n📋 Step 7: Verifying chat thread was created...');
    const chatThreads = await supabaseRequest(`chat_threads?event_id=eq.${event.id}&is_notification=eq.true&order=created_at.desc&limit=1&select=*`);
    if (chatThreads.length > 0) {
      console.log(`✅ Notification chat thread created: ${chatThreads[0].name}`);
    } else {
      console.log('⚠️ No notification chat thread found');
    }

    console.log('\n🎉 Push notification test completed!');
    console.log('\n📱 Check your mobile devices for push notifications!');
    console.log('   - The notification should appear even when the app is closed');
    console.log('   - Tapping it should open the app and navigate to the event');

  } catch (error) {
    console.error('❌ Error testing push notifications:', error.message);
    process.exit(1);
  }
}

// Run the test
testPushNotifications().catch(console.error);
