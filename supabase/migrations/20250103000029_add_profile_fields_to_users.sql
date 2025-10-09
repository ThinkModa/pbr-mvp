-- Add profile fields to users table
-- This migration adds the new profile fields required for the profile page

-- Add new profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS t_shirt_size VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_needs TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_affiliation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS title_position VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing users to have first_name and last_name from the name field
-- This is a one-time migration for existing data
UPDATE users 
SET first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN name) > 0 THEN SPLIT_PART(name, ' ', 2)
        ELSE ''
    END
WHERE first_name IS NULL AND last_name IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_organization_affiliation ON users(organization_affiliation);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points);

-- Add comments for documentation
COMMENT ON COLUMN users.first_name IS 'User first name for profile display';
COMMENT ON COLUMN users.last_name IS 'User last name for profile display';
COMMENT ON COLUMN users.phone_number IS 'User phone number for contact information';
COMMENT ON COLUMN users.t_shirt_size IS 'User t-shirt size for event swag';
COMMENT ON COLUMN users.dietary_restrictions IS 'User dietary restrictions for event catering';
COMMENT ON COLUMN users.accessibility_needs IS 'User accessibility needs for event accommodations';
COMMENT ON COLUMN users.bio IS 'User biography for profile display';
COMMENT ON COLUMN users.organization_affiliation IS 'Organization the user is affiliated with';
COMMENT ON COLUMN users.title_position IS 'User job title or position';
COMMENT ON COLUMN users.points IS 'User points for gamification system';

