-- Add location_name column to activities table
-- Migration: 20250103000075_add_location_name_to_activities.sql

-- Add location_name column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Create index for location_name for better search performance
CREATE INDEX IF NOT EXISTS idx_activities_location_name ON activities(location_name);

-- Add comment for documentation
COMMENT ON COLUMN activities.location_name IS 'Custom location name (e.g., "Main Conference Room") separate from Google Places address data';
COMMENT ON COLUMN activities.location IS 'Google Places data (address, coordinates, placeId) for location autocomplete and mapping';

-- Update existing data: extract name from location JSONB to location_name column
-- This preserves existing data by moving the 'name' field from location JSONB to the new location_name column
UPDATE activities 
SET location_name = COALESCE(
  (location->>'name')::TEXT,
  (location->>'formatted_address')::TEXT,
  (location->>'address')::TEXT
)
WHERE location IS NOT NULL 
  AND location_name IS NULL;

-- Clean up location JSONB by removing 'name' field since it's now in location_name column
-- Keep address, coordinates, and placeId in the location JSONB
UPDATE activities 
SET location = jsonb_build_object(
  'address', COALESCE(location->>'address', location->>'formatted_address'),
  'coordinates', location->'coordinates',
  'placeId', location->>'placeId'
)
WHERE location IS NOT NULL 
  AND location ? 'name';

-- Handle cases where location is just a string (legacy data)
UPDATE activities 
SET location_name = location::TEXT,
    location = jsonb_build_object('address', location::TEXT)
WHERE location IS NOT NULL 
  AND jsonb_typeof(location) = 'string';
