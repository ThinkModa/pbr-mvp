#!/usr/bin/env node

/**
 * Test Chat Notification System
 * This script sends a chat message and validates push notification creation
 */

const SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';

// Helper function to make API calls
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

// Test chat notification system
async function testChatNotification() {
  console.log('🧪 Testing Chat Notification System...\n');

  try {
    // Step 1: Get available users
    console.log('📋 Step 1: Getting available users...');
    const users = await supabaseRequest('users?select=id,email,name&limit=10');
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to test chat notifications');
      return;
    }

    const sender = users[0]; // First user as sender
    const receiver = users[1]; // Second user as receiver

    console.log(`\n📤 Sender: ${sender.name} (${sender.email})`);
    console.log(`📥 Receiver: ${receiver.name} (${receiver.email})`);

    // Step 2: Create a DM thread between users
    console.log('\n📋 Step 2: Creating DM thread...');
    const threadData = {
      type: 'dm',
      is_private: true,
      allow_member_invites: false,
      allow_file_uploads: true,
      metadata: {}
    };

    const thread = await supabaseRequest('chat_threads', {
      method: 'POST',
      body: JSON.stringify(threadData)
    });

    console.log(`✅ Created thread: ${thread[0].id}`);

    // Step 3: Add both users to the thread
    console.log('\n📋 Step 3: Adding users to thread...');
    
    // Add sender
    await supabaseRequest('chat_memberships', {
      method: 'POST',
      body: JSON.stringify({
        thread_id: thread[0].id,
        user_id: sender.id,
        role: 'member',
        notifications_enabled: true
      })
    });

    // Add receiver
    await supabaseRequest('chat_memberships', {
      method: 'POST',
      body: JSON.stringify({
        thread_id: thread[0].id,
        user_id: receiver.id,
        role: 'member',
        notifications_enabled: true
      })
    });

    console.log('✅ Added both users to thread');

    // Step 4: Send a test message
    console.log('\n📋 Step 4: Sending test message...');
    const messageData = {
      thread_id: thread[0].id,
      user_id: sender.id,
      content: 'Test message for push notification validation',
      message_type: 'text'
    };

    const message = await supabaseRequest('chat_messages', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });

    console.log(`✅ Sent message: ${message[0].id}`);

    // Step 5: Check for push tokens
    console.log('\n📋 Step 5: Checking push tokens...');
    const pushTokens = await supabaseRequest('user_push_tokens?select=*');
    console.log(`Found ${pushTokens.length} push tokens:`);
    pushTokens.forEach((token, index) => {
      console.log(`  ${index + 1}. User: ${token.user_id}, Platform: ${token.platform}, Token: ${token.token.substring(0, 20)}...`);
    });

    // Step 6: Check for notifications
    console.log('\n📋 Step 6: Checking notifications...');
    const notifications = await supabaseRequest('notifications?select=*&order=created_at.desc&limit=5');
    console.log(`Found ${notifications.length} recent notifications:`);
    notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. Type: ${notification.type}, Title: ${notification.title}, Created: ${notification.created_at}`);
    });

    // Step 7: Check for user notifications
    console.log('\n📋 Step 7: Checking user notifications...');
    const userNotifications = await supabaseRequest('user_notifications?select=*&order=created_at.desc&limit=5');
    console.log(`Found ${userNotifications.length} recent user notifications:`);
    userNotifications.forEach((userNotification, index) => {
      console.log(`  ${index + 1}. User: ${userNotification.user_id}, Notification: ${userNotification.notification_id}, Read: ${userNotification.is_read}`);
    });

    // Step 8: Check for chat message notifications specifically
    console.log('\n📋 Step 8: Checking chat message notifications...');
    const chatNotifications = await supabaseRequest(`notifications?type=eq.chat_message&select=*&order=created_at.desc&limit=5`);
    console.log(`Found ${chatNotifications.length} chat message notifications:`);
    chatNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. Title: ${notification.title}, Content: ${notification.content}, Created: ${notification.created_at}`);
    });

    console.log('\n✅ Chat notification test completed!');
    console.log('\n📊 Summary:');
    console.log(`  • Message sent: ${message[0].id}`);
    console.log(`  • Push tokens available: ${pushTokens.length}`);
    console.log(`  • Total notifications: ${notifications.length}`);
    console.log(`  • User notifications: ${userNotifications.length}`);
    console.log(`  • Chat notifications: ${chatNotifications.length}`);

  } catch (error) {
    console.error('❌ Error testing chat notifications:', error.message);
  }
}

testChatNotification();
