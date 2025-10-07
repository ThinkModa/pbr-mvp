-- Create event_organizations junction table for organizations
CREATE TABLE event_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Organization role in this specific event
    role VARCHAR(100) NOT NULL DEFAULT 'sponsor', -- sponsor, vendor, partner, participant
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

    -- Ensure unique organization per event
    UNIQUE(event_id, organization_id)
);

-- Disable RLS for event_organizations table for testing purposes
ALTER TABLE event_organizations DISABLE ROW LEVEL SECURITY;
