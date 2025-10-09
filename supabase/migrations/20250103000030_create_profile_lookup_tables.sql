-- Create lookup tables for professional categories and community interests
-- This migration creates the reference tables for the profile system

-- Create professional_categories table
CREATE TABLE IF NOT EXISTS professional_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- For future icon support
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create community_interests table
CREATE TABLE IF NOT EXISTS community_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- For future icon support
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_categories_name ON professional_categories(name);
CREATE INDEX IF NOT EXISTS idx_professional_categories_active ON professional_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_professional_categories_sort ON professional_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_community_interests_name ON community_interests(name);
CREATE INDEX IF NOT EXISTS idx_community_interests_active ON community_interests(is_active);
CREATE INDEX IF NOT EXISTS idx_community_interests_sort ON community_interests(sort_order);

-- Add comments for documentation
COMMENT ON TABLE professional_categories IS 'Lookup table for professional categories that users can select';
COMMENT ON TABLE community_interests IS 'Lookup table for community interests that users can select';
COMMENT ON COLUMN professional_categories.name IS 'Name of the professional category';
COMMENT ON COLUMN professional_categories.description IS 'Description of the professional category';
COMMENT ON COLUMN professional_categories.icon IS 'Icon identifier for the category (future use)';
COMMENT ON COLUMN professional_categories.is_active IS 'Whether this category is available for selection';
COMMENT ON COLUMN professional_categories.sort_order IS 'Order in which categories should be displayed';

COMMENT ON COLUMN community_interests.name IS 'Name of the community interest';
COMMENT ON COLUMN community_interests.description IS 'Description of the community interest';
COMMENT ON COLUMN community_interests.icon IS 'Icon identifier for the interest (future use)';
COMMENT ON COLUMN community_interests.is_active IS 'Whether this interest is available for selection';
COMMENT ON COLUMN community_interests.sort_order IS 'Order in which interests should be displayed';

