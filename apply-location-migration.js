#!/usr/bin/env node

/**
 * Apply Location Migration to Production Database
 * This script applies the location_name column migration to the production database
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

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

// Apply the migration
async function applyMigration() {
  console.log('🔄 Applying location_name migration to production database...');
  
  try {
    // Step 1: Add location_name column
    console.log('📝 Step 1: Adding location_name column...');
    const addColumnResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_name TEXT;'
      })
    });

    if (!addColumnResponse.ok) {
      const errorText = await addColumnResponse.text();
      console.error('❌ Error adding column:', errorText);
      return;
    }
    console.log('✅ location_name column added');

    // Step 2: Create index
    console.log('📝 Step 2: Creating index...');
    const indexResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'CREATE INDEX IF NOT EXISTS idx_activities_location_name ON activities(location_name);'
      })
    });

    if (!indexResponse.ok) {
      const errorText = await indexResponse.text();
      console.error('❌ Error creating index:', errorText);
      return;
    }
    console.log('✅ Index created');

    // Step 3: Migrate existing data
    console.log('📝 Step 3: Migrating existing data...');
    const migrateResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          UPDATE activities 
          SET location_name = COALESCE(
            (location->>'name')::TEXT,
            (location->>'formatted_address')::TEXT,
            (location->>'address')::TEXT
          )
          WHERE location IS NOT NULL 
            AND location_name IS NULL;
        `
      })
    });

    if (!migrateResponse.ok) {
      const errorText = await migrateResponse.text();
      console.error('❌ Error migrating data:', errorText);
      return;
    }
    console.log('✅ Data migrated');

    // Step 4: Clean up location JSONB
    console.log('📝 Step 4: Cleaning up location JSONB...');
    const cleanupResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          UPDATE activities 
          SET location = jsonb_build_object(
            'address', COALESCE(location->>'address', location->>'formatted_address'),
            'coordinates', location->'coordinates',
            'placeId', location->>'placeId'
          )
          WHERE location IS NOT NULL 
            AND location ? 'name';
        `
      })
    });

    if (!cleanupResponse.ok) {
      const errorText = await cleanupResponse.text();
      console.error('❌ Error cleaning up location data:', errorText);
      return;
    }
    console.log('✅ Location data cleaned up');

    console.log('🎉 Migration completed successfully!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const activities = await supabaseRequest('activities?select=id,title,location_name,location&limit=5');
    console.log('Sample activities after migration:');
    activities.forEach(activity => {
      console.log(`  - ${activity.title}: location_name="${activity.location_name}", location=${JSON.stringify(activity.location)}`);
    });

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    throw error;
  }
}

// Main execution
applyMigration().catch(console.error);
