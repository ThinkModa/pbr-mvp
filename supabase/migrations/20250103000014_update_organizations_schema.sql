-- Update organizations table to match the OrganizationsService interface
-- This migration adds missing columns and updates the schema

-- Add missing columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS size VARCHAR(50),
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_contact BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_sponsor BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- Update existing organizations with sample data
UPDATE organizations SET 
    industry = 'Technology',
    size = 'medium',
    founded_year = 2020,
    is_public = true,
    allow_contact = true,
    is_sponsor = false,
    tags = '["community", "events", "networking"]'::jsonb
WHERE name = 'PBR Community';

-- Add some additional sample organizations
INSERT INTO organizations (id, name, slug, description, website, email, industry, size, founded_year, is_public, allow_contact, is_sponsor, tags) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TechCorp Solutions', 'techcorp-solutions', 'Leading technology solutions provider', 'https://techcorp.com', 'info@techcorp.com', 'Technology', 'large', 2015, true, true, true, '["technology", "enterprise", "sponsor"]'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Design Studio', 'design-studio', 'Creative design and branding agency', 'https://designstudio.com', 'hello@designstudio.com', 'Design', 'small', 2018, true, true, true, '["design", "creative", "sponsor"]')
ON CONFLICT (id) DO NOTHING;
