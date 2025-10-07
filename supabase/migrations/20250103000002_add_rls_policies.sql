-- Row Level Security (RLS) Policies
-- Keep these simple and basic for flexibility

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_objects ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies - Simple and Flexible

-- Users: Users can only see their own data, admins can see all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Organizations: Public read, members can update
CREATE POLICY "Anyone can view organizations" ON organizations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Organization members can update" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om
            WHERE om.organization_id = organizations.id 
            AND om.user_id = auth.uid() 
            AND om.role IN ('admin', 'member')
            AND om.is_active = true
        )
    );

CREATE POLICY "Admins can manage organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Organization Memberships: Members can see their own memberships
CREATE POLICY "Users can view own memberships" ON organization_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage memberships" ON organization_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om
            WHERE om.organization_id = organization_memberships.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'admin'
            AND om.is_active = true
        )
    );

-- Events: Public read, organization members can update
CREATE POLICY "Anyone can view public events" ON events
    FOR SELECT USING (is_public = true AND status = 'published');

CREATE POLICY "Organization members can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om
            WHERE om.organization_id = events.organization_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Activities: Same as events
CREATE POLICY "Anyone can view public activities" ON activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = activities.event_id
            AND e.is_public = true
            AND e.status = 'published'
        )
    );

CREATE POLICY "Organization members can manage activities" ON activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN organization_memberships om ON om.organization_id = e.organization_id
            WHERE e.id = activities.event_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Event RSVPs: Users can manage their own RSVPs
CREATE POLICY "Users can manage own event RSVPs" ON event_rsvps
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization members can view event RSVPs" ON event_rsvps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN organization_memberships om ON om.organization_id = e.organization_id
            WHERE e.id = event_rsvps.event_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Activity RSVPs: Same as event RSVPs
CREATE POLICY "Users can manage own activity RSVPs" ON activity_rsvps
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization members can view activity RSVPs" ON activity_rsvps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activities a
            JOIN events e ON e.id = a.event_id
            JOIN organization_memberships om ON om.organization_id = e.organization_id
            WHERE a.id = activity_rsvps.activity_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Chat Threads: Members can access their threads
CREATE POLICY "Chat members can access threads" ON chat_threads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_memberships cm
            WHERE cm.thread_id = chat_threads.id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
        )
    );

-- Chat Messages: Members can access messages in their threads
CREATE POLICY "Chat members can access messages" ON chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_memberships cm
            WHERE cm.thread_id = chat_messages.thread_id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
        )
    );

-- Chat Memberships: Users can see their own memberships
CREATE POLICY "Users can view own chat memberships" ON chat_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Chat admins can manage memberships" ON chat_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_memberships cm
            WHERE cm.thread_id = chat_memberships.thread_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.is_active = true
        )
    );

-- Audit Logs: Only admins can access
CREATE POLICY "Admins can access audit logs" ON audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Media Objects: Users can access their own uploads, public media is viewable by all
CREATE POLICY "Users can manage own media" ON media_objects
    FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Anyone can view public media" ON media_objects
    FOR SELECT USING (is_public = true);

-- Allow service role to bypass RLS (for migrations and admin operations)
CREATE POLICY "Service role bypass" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON organizations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON organization_memberships
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON activities
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON event_rsvps
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON activity_rsvps
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON chat_threads
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON chat_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON chat_memberships
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON media_objects
    FOR ALL USING (auth.role() = 'service_role');
