#!/usr/bin/env node

const SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';

async function checkActivities() {
  try {
    console.log('Checking activities for Know Us Atlanta 2025...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/activities?event_id=eq.840b8aac-424a-4fd0-90b8-9985840d26f8&select=*`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log(`Found ${data.length} activities:`);
      data.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.title}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkActivities();
