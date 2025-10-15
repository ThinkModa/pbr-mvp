-- Add location coordinates to activities table for Google Maps integration
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add indexes for efficient coordinate queries
CREATE INDEX IF NOT EXISTS idx_activities_coordinates ON activities(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_location_address ON activities(location_address) WHERE location_address IS NOT NULL;

-- Add comments
COMMENT ON COLUMN activities.location_address IS 'Full address string for the activity location';
COMMENT ON COLUMN activities.latitude IS 'Latitude coordinate for map display (-90 to 90)';
COMMENT ON COLUMN activities.longitude IS 'Longitude coordinate for map display (-180 to 180)';
