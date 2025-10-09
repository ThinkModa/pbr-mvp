-- Create junction tables for user professional categories, community interests, and event attendance
-- This migration creates the many-to-many relationship tables for the profile system

-- Create user_professional_categories junction table
CREATE TABLE IF NOT EXISTS user_professional_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES professional_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, category_id)
);

-- Create user_community_interests junction table
CREATE TABLE IF NOT EXISTS user_community_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES community_interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, interest_id)
);

-- Create user_event_attendance table for tracking past events
CREATE TABLE IF NOT EXISTS user_event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT, -- For future use (feedback, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_professional_categories_user_id ON user_professional_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_professional_categories_category_id ON user_professional_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_user_community_interests_user_id ON user_community_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_community_interests_interest_id ON user_community_interests(interest_id);

CREATE INDEX IF NOT EXISTS idx_user_event_attendance_user_id ON user_event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_attendance_event_id ON user_event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_attendance_attended_at ON user_event_attendance(attended_at);

-- Add comments for documentation
COMMENT ON TABLE user_professional_categories IS 'Junction table linking users to their selected professional categories';
COMMENT ON TABLE user_community_interests IS 'Junction table linking users to their selected community interests';
COMMENT ON TABLE user_event_attendance IS 'Table tracking which events users have actually attended';

COMMENT ON COLUMN user_professional_categories.user_id IS 'Reference to the user';
COMMENT ON COLUMN user_professional_categories.category_id IS 'Reference to the professional category';

COMMENT ON COLUMN user_community_interests.user_id IS 'Reference to the user';
COMMENT ON COLUMN user_community_interests.interest_id IS 'Reference to the community interest';

COMMENT ON COLUMN user_event_attendance.user_id IS 'Reference to the user';
COMMENT ON COLUMN user_event_attendance.event_id IS 'Reference to the event';
COMMENT ON COLUMN user_event_attendance.attended_at IS 'When the user attended the event';
COMMENT ON COLUMN user_event_attendance.check_in_time IS 'When the user checked in to the event';
COMMENT ON COLUMN user_event_attendance.check_out_time IS 'When the user checked out of the event';
COMMENT ON COLUMN user_event_attendance.notes IS 'Optional notes about the attendance';

