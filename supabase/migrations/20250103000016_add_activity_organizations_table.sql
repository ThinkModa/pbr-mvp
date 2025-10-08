-- Create activity_organizations junction table
CREATE TABLE activity_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Organization role in this specific activity
    role VARCHAR(100) NOT NULL DEFAULT 'vendor',
    
    -- Order for display
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique organization per activity
    UNIQUE(activity_id, organization_id)
);

-- Create indexes for better performance
CREATE INDEX idx_activity_organizations_activity_id ON activity_organizations(activity_id);
CREATE INDEX idx_activity_organizations_organization_id ON activity_organizations(organization_id);
CREATE INDEX idx_activity_organizations_display_order ON activity_organizations(display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_activity_organizations_updated_at BEFORE UPDATE ON activity_organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on activity_organizations table
ALTER TABLE activity_organizations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view public activity organizations
CREATE POLICY "Anyone can view public activity organizations" ON activity_organizations
    FOR SELECT USING (is_public = true);

-- Allow service role to bypass RLS (for admin operations)
CREATE POLICY "Service role bypass" ON activity_organizations
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon role to perform all operations (for admin dashboard)
CREATE POLICY "Anon role can manage activity organizations" ON activity_organizations
    FOR ALL USING (auth.role() = 'anon');
