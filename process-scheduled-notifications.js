#!/usr/bin/env node

/**
 * Process Scheduled Notifications
 * 
 * This script processes all due scheduled notifications and sends them.
 * It should be run every 5-10 minutes via a cron job or scheduled task.
 * 
 * Usage:
 *   node process-scheduled-notifications.js
 * 
 * Environment Variables Required:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_SERVICE_ROLE_KEY
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

async function processScheduledNotifications() {
  console.log('🕐 Processing scheduled notifications...');
  
  try {
    // Call the database function to process scheduled notifications
    const result = await supabaseRequest('rpc/process_scheduled_notifications', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    console.log('✅ Scheduled notifications processed successfully');
    console.log('📊 Result:', result);
    
  } catch (error) {
    console.error('❌ Error processing scheduled notifications:', error.message);
    process.exit(1);
  }
}

// Run the script
processScheduledNotifications().catch(console.error);
