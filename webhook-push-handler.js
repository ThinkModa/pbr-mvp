#!/usr/bin/env node

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function callEdgeFunction(notificationData) {
  try {
    console.log('📱 Calling Edge Function with data:', notificationData);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });
    
    const result = await response.json();
    console.log('📱 Edge Function response:', result);
    
    if (response.ok) {
      console.log('✅ Push notification sent successfully!');
    } else {
      console.log('❌ Push notification failed:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error calling Edge Function:', error.message);
    throw error;
  }
}

// This would be called by a webhook when the database trigger fires
async function handlePushNotificationWebhook(webhookData) {
  try {
    console.log('🔔 Received push notification webhook:', webhookData);
    
    // Parse the webhook data (this would come from the database trigger)
    const notificationData = JSON.parse(webhookData);
    
    // Call the Edge Function
    await callEdgeFunction(notificationData);
    
  } catch (error) {
    console.error('❌ Error handling webhook:', error.message);
  }
}

// For testing, let's manually trigger a push notification
async function testManualPushNotification() {
  console.log('🧪 Testing manual push notification...');
  
  try {
    // Get a recent notification
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications?status=eq.pending&order=created_at.desc&limit=1&select=id,title,content,type,event_id,created_by`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const notifications = await response.json();
    
    if (notifications.length > 0) {
      const notification = notifications[0];
      console.log('📬 Found pending notification:', notification.title);
      
      // Get the user who should receive this notification
      const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_notifications?notification_id=eq.${notification.id}&select=user_id`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const userNotifications = await userResponse.json();
      
      if (userNotifications.length > 0) {
        const userId = userNotifications[0].user_id;
        console.log('👤 Sending to user:', userId);
        
        // Call the Edge Function
        await callEdgeFunction({
          notification_id: notification.id,
          user_id: userId,
          title: notification.title,
          body: notification.content,
          data: {
            type: notification.type,
            event_id: notification.event_id
          }
        });
        
        // Update notification status
        await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notification.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
        });
        
        console.log('✅ Notification status updated to sent');
      } else {
        console.log('❌ No users assigned to this notification');
      }
    } else {
      console.log('❌ No pending notifications found');
    }
    
  } catch (error) {
    console.error('❌ Error in manual test:', error.message);
  }
}

// Run the test
testManualPushNotification().catch(console.error);
