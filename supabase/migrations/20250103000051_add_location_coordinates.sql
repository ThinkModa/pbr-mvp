-- Add location coordinates to events table for Google Maps integration
-- This migration adds address, latitude, and longitude fields to support map display

-- Add new location fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add indexes for efficient coordinate queries
CREATE INDEX IF NOT EXISTS idx_events_coordinates ON events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_location_address ON events(location_address) WHERE location_address IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN events.location_address IS 'Full address string for the event location (e.g., "123 Main St, New York, NY 10001, USA")';
COMMENT ON COLUMN events.latitude IS 'Latitude coordinate for map display (-90 to 90)';
COMMENT ON COLUMN events.longitude IS 'Longitude coordinate for map display (-180 to 180)';

-- Update existing events with placeholder data (optional - for testing)
-- This can be removed in production
UPDATE events 
SET location_address = 'Address TBD', 
    latitude = 40.7128, 
    longitude = -74.0060 
WHERE location_address IS NULL 
  AND latitude IS NULL 
  AND longitude IS NULL;
