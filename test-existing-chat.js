#!/usr/bin/env node

/**
 * Test Existing Chat and Notifications
 */

const SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function testExistingChat() {
  console.log('🧪 Testing Existing Chat and Notifications...\n');

  try {
    // Check existing chat threads
    console.log('📋 Checking existing chat threads...');
    const threads = await supabaseRequest('chat_threads?select=*&limit=10');
    console.log(`Found ${threads.length} chat threads:`);
    threads.forEach((thread, index) => {
      console.log(`  ${index + 1}. ID: ${thread.id}, Type: ${thread.type}, Name: ${thread.name || 'N/A'}`);
    });

    // Check existing chat messages
    console.log('\n📋 Checking existing chat messages...');
    const messages = await supabaseRequest('chat_messages?select=*&order=created_at.desc&limit=10');
    console.log(`Found ${messages.length} recent messages:`);
    messages.forEach((message, index) => {
      console.log(`  ${index + 1}. Thread: ${message.thread_id}, User: ${message.user_id}, Content: ${message.content.substring(0, 50)}...`);
    });

    // Check push tokens
    console.log('\n📋 Checking push tokens...');
    const pushTokens = await supabaseRequest('user_push_tokens?select=*');
    console.log(`Found ${pushTokens.length} push tokens:`);
    pushTokens.forEach((token, index) => {
      console.log(`  ${index + 1}. User: ${token.user_id}, Platform: ${token.platform}, Token: ${token.token.substring(0, 20)}...`);
    });

    // Check notifications
    console.log('\n📋 Checking notifications...');
    const notifications = await supabaseRequest('notifications?select=*&order=created_at.desc&limit=10');
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. Type: ${notification.type}, Title: ${notification.title}, Created: ${notification.created_at}`);
    });

    // Check user notifications
    console.log('\n📋 Checking user notifications...');
    const userNotifications = await supabaseRequest('user_notifications?select=*&order=created_at.desc&limit=10');
    console.log(`Found ${userNotifications.length} user notifications:`);
    userNotifications.forEach((userNotification, index) => {
      console.log(`  ${index + 1}. User: ${userNotification.user_id}, Notification: ${userNotification.notification_id}, Read: ${userNotification.is_read}`);
    });

    // Check if there are any chat message notifications
    console.log('\n📋 Checking chat message notifications specifically...');
    const chatNotifications = await supabaseRequest(`notifications?type=eq.chat_message&select=*&order=created_at.desc&limit=5`);
    console.log(`Found ${chatNotifications.length} chat message notifications:`);
    chatNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. Title: ${notification.title}, Content: ${notification.content}, Created: ${notification.created_at}`);
    });

    console.log('\n✅ Analysis complete!');
    console.log('\n📊 Summary:');
    console.log(`  • Chat threads: ${threads.length}`);
    console.log(`  • Chat messages: ${messages.length}`);
    console.log(`  • Push tokens: ${pushTokens.length}`);
    console.log(`  • Notifications: ${notifications.length}`);
    console.log(`  • User notifications: ${userNotifications.length}`);
    console.log(`  • Chat notifications: ${chatNotifications.length}`);

    if (pushTokens.length === 0) {
      console.log('\n⚠️  No push tokens found - users need to register their devices for push notifications');
    }

    if (chatNotifications.length === 0) {
      console.log('\n⚠️  No chat message notifications found - the notification system may not be working');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExistingChat();
