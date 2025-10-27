#!/usr/bin/env node

/**
 * Restore Activities for "Know Us Atlanta 2025" Event
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';

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

// Restore activities
async function restoreActivities() {
  console.log('🔄 Restoring activities for "Know Us Atlanta 2025"...');
  
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error('❌ Backup file not found:', BACKUP_FILE);
      return;
    }

    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`✅ Loaded backup from: ${backup.timestamp}`);

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

      console.log(`📝 Preparing to restore ${activitiesToRestore.length} activities...`);

      // Restore activities one by one to avoid conflicts
      for (let i = 0; i < activitiesToRestore.length; i++) {
        const activity = activitiesToRestore[i];
        try {
          await supabaseRequest(`activities`, {
            method: 'POST',
            body: JSON.stringify(activity)
          });
          console.log(`✅ Restored activity ${i + 1}/${activitiesToRestore.length}: ${activity.title}`);
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            console.log(`⚠️  Activity already exists: ${activity.title}`);
          } else {
            console.error(`❌ Error restoring activity "${activity.title}":`, error.message);
          }
        }
      }
    }

    console.log('✅ Activities restoration completed!');
  } catch (error) {
    console.error('❌ Error restoring activities:', error.message);
    throw error;
  }
}

restoreActivities().catch(console.error);
