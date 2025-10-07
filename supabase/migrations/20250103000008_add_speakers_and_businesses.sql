-- Add speakers and businesses tables
-- This migration adds support for managing speakers and businesses associated with events

-- Create speakers table
CREATE TABLE speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Professional info
    title VARCHAR(200), -- Job title
    company VARCHAR(200),
    bio TEXT,
    expertise JSONB DEFAULT '[]'::jsonb, -- Areas of expertise
    
    -- Media
    profile_image_url TEXT,
    headshot_url TEXT,
    
    -- Social links
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Contact preferences
    is_public BOOLEAN NOT NULL DEFAULT true,
    allow_contact BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create event_speakers junction table
CREATE TABLE event_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    
    -- Speaker role in this specific event
    role VARCHAR(100) NOT NULL DEFAULT 'speaker', -- speaker, moderator, panelist, etc.
    session_title VARCHAR(200), -- Specific session they're speaking in
    session_description TEXT,
    
    -- Timing (if different from main event)
    session_start_time TIMESTAMP WITH TIME ZONE,
    session_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Order for display
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique speaker per event
    UNIQUE(event_id, speaker_id)
);

-- Create activity_speakers junction table
CREATE TABLE activity_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    
    -- Speaker role in this specific activity
    role VARCHAR(100) NOT NULL DEFAULT 'speaker',
    
    -- Order for display
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique speaker per activity
    UNIQUE(activity_id, speaker_id)
);

-- Create businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50), -- startup, small, medium, large, enterprise
    
    -- Contact info
    email VARCHAR(255),
    phone VARCHAR(20),
    website TEXT,
    
    -- Address
    address JSONB,
    
    -- Media
    logo_url TEXT,
    cover_image_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    
    -- Social links
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Business details
    founded_year INTEGER,
    employee_count INTEGER,
    revenue VARCHAR(50), -- revenue range
    
    -- Services/Products
    services JSONB DEFAULT '[]'::jsonb,
    products JSONB DEFAULT '[]'::jsonb,
    
    -- Contact preferences
    is_public BOOLEAN NOT NULL DEFAULT true,
    allow_contact BOOLEAN NOT NULL DEFAULT true,
    is_sponsor BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create event_businesses junction table
CREATE TABLE event_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Business role in this specific event
    role VARCHAR(100) NOT NULL DEFAULT 'participant', -- sponsor, vendor, partner, participant
    sponsorship_level VARCHAR(50), -- gold, silver, bronze, etc.
    booth_number VARCHAR(20),
    
    -- Display settings
    display_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    
    -- Status
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique business per event
    UNIQUE(event_id, business_id)
);

-- Create business_contacts table
CREATE TABLE business_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Contact info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    title VARCHAR(200), -- Job title
    
    -- Role in business
    role VARCHAR(100) NOT NULL DEFAULT 'contact', -- owner, manager, representative, etc.
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- Contact preferences
    is_public BOOLEAN NOT NULL DEFAULT true,
    allow_contact BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_speakers_organization_id ON speakers(organization_id);
CREATE INDEX idx_speakers_email ON speakers(email);
CREATE INDEX idx_speakers_is_public ON speakers(is_public);

CREATE INDEX idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX idx_event_speakers_speaker_id ON event_speakers(speaker_id);
CREATE INDEX idx_event_speakers_display_order ON event_speakers(display_order);

CREATE INDEX idx_activity_speakers_activity_id ON activity_speakers(activity_id);
CREATE INDEX idx_activity_speakers_speaker_id ON activity_speakers(speaker_id);
CREATE INDEX idx_activity_speakers_display_order ON activity_speakers(display_order);

CREATE INDEX idx_businesses_organization_id ON businesses(organization_id);
CREATE INDEX idx_businesses_name ON businesses(name);
CREATE INDEX idx_businesses_industry ON businesses(industry);
CREATE INDEX idx_businesses_is_public ON businesses(is_public);
CREATE INDEX idx_businesses_is_sponsor ON businesses(is_sponsor);

CREATE INDEX idx_event_businesses_event_id ON event_businesses(event_id);
CREATE INDEX idx_event_businesses_business_id ON event_businesses(business_id);
CREATE INDEX idx_event_businesses_role ON event_businesses(role);
CREATE INDEX idx_event_businesses_display_order ON event_businesses(display_order);

CREATE INDEX idx_business_contacts_business_id ON business_contacts(business_id);
CREATE INDEX idx_business_contacts_email ON business_contacts(email);
CREATE INDEX idx_business_contacts_is_primary ON business_contacts(is_primary);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON speakers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_speakers_updated_at BEFORE UPDATE ON event_speakers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_speakers_updated_at BEFORE UPDATE ON activity_speakers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_businesses_updated_at BEFORE UPDATE ON event_businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_contacts_updated_at BEFORE UPDATE ON business_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
