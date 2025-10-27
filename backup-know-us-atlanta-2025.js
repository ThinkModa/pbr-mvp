#!/usr/bin/env node

/**
 * Backup and Restore Script for "Know Us Atlanta 2025" Event
 * This script backs up the event data before migration and restores it after
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const BACKUP_FILE = path.join(__dirname, 'know-us-atlanta-2025-backup.json');

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

// Backup the event data
async function backupEventData() {
  console.log('🔄 Backing up "Know Us Atlanta 2025" event data...');
  
  try {
    // Find the event by title
    const events = await supabaseRequest(`events?title=ilike.Know%20Us:%20Atlanta%202025&select=*`);
    
    if (events.length === 0) {
      console.log('⚠️  No "Know Us Atlanta 2025" event found');
      return null;
    }

    const event = events[0];
    console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);

    // Get all activities for this event
    const activities = await supabaseRequest(`activities?event_id=eq.${event.id}&select=*`);
    console.log(`✅ Found ${activities.length} activities`);

    // Get track data if exists
    const tracks = await supabaseRequest(`event_tracks?event_id=eq.${event.id}&select=*`);
    console.log(`✅ Found ${tracks.length} tracks`);

    // Get track groups if exist
    const trackGroups = await supabaseRequest(`track_groups?event_id=eq.${event.id}&select=*`);
    console.log(`✅ Found ${trackGroups.length} track groups`);

    // Get track activities if exist
    let trackActivities = [];
    if (tracks.length > 0) {
      const trackIds = tracks.map(t => t.id).join(',');
      trackActivities = await supabaseRequest(`track_activities?track_id=in.(${trackIds})&select=*`);
      console.log(`✅ Found ${trackActivities.length} track activity assignments`);
    }

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      event,
      activities,
      tracks,
      trackGroups,
      trackActivities
    };

    // Save to file
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved to: ${BACKUP_FILE}`);
    
    return backup;
  } catch (error) {
    console.error('❌ Error backing up event data:', error.message);
    throw error;
  }
}

// Restore the event data
async function restoreEventData() {
  console.log('🔄 Restoring "Know Us Atlanta 2025" event data...');
  
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error('❌ Backup file not found:', BACKUP_FILE);
      return;
    }

    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`✅ Loaded backup from: ${backup.timestamp}`);

    // Restore event
    const restoredEvent = await supabaseRequest(`events`, {
      method: 'POST',
      body: JSON.stringify(backup.event)
    });

    console.log(`✅ Event restored: ${restoredEvent[0].title} (ID: ${restoredEvent[0].id})`);

    // Restore activities with new schema
    if (backup.activities.length > 0) {
      const activitiesToRestore = backup.activities.map(activity => {
        // Handle location data migration
        let locationName = '';
        let location = null;

        if (activity.location) {
          if (typeof activity.location === 'string') {
            locationName = activity.location;
            location = { address: activity.location };
          } else if (activity.location.name) {
            locationName = activity.location.name;
            location = {
              address: activity.location.address || activity.location.formatted_address,
              coordinates: activity.location.coordinates,
              placeId: activity.location.placeId
            };
          } else {
            locationName = activity.location.address || activity.location.formatted_address || '';
            location = activity.location;
          }
        }

        return {
          ...activity,
          location_name: locationName,
          location: location
        };
      });

      try {
        await supabaseRequest(`activities`, {
          method: 'POST',
          body: JSON.stringify(activitiesToRestore)
        });
        console.log(`✅ Restored ${activitiesToRestore.length} activities`);
      } catch (error) {
        console.error('❌ Error restoring activities:', error.message);
      }
    }

    // Restore tracks
    if (backup.tracks.length > 0) {
      try {
        await supabaseRequest(`event_tracks`, {
          method: 'POST',
          body: JSON.stringify(backup.tracks)
        });
        console.log(`✅ Restored ${backup.tracks.length} tracks`);
      } catch (error) {
        console.error('❌ Error restoring tracks:', error.message);
      }
    }

    // Restore track groups
    if (backup.trackGroups.length > 0) {
      try {
        await supabaseRequest(`track_groups`, {
          method: 'POST',
          body: JSON.stringify(backup.trackGroups)
        });
        console.log(`✅ Restored ${backup.trackGroups.length} track groups`);
      } catch (error) {
        console.error('❌ Error restoring track groups:', error.message);
      }
    }

    // Restore track activities
    if (backup.trackActivities.length > 0) {
      try {
        await supabaseRequest(`track_activities`, {
          method: 'POST',
          body: JSON.stringify(backup.trackActivities)
        });
        console.log(`✅ Restored ${backup.trackActivities.length} track activity assignments`);
      } catch (error) {
        console.error('❌ Error restoring track activities:', error.message);
      }
    }

    console.log('✅ Event data restoration completed!');
  } catch (error) {
    console.error('❌ Error restoring event data:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      await backupEventData();
      break;
    case 'restore':
      await restoreEventData();
      break;
    default:
      console.log('Usage: node backup-know-us-atlanta-2025.js [backup|restore]');
      console.log('  backup  - Backup the event data before migration');
      console.log('  restore - Restore the event data after migration');
      break;
  }
}

main().catch(console.error);
