-- Development seed data
-- Only run this in development/staging environments

-- Insert sample users
INSERT INTO users (id, email, name, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@pbr.com', 'Admin User', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'business@pbr.com', 'Business Owner', 'business'),
    ('33333333-3333-3333-3333-333333333333', 'user@pbr.com', 'Regular User', 'general');

-- Insert sample organization
INSERT INTO organizations (id, name, slug, description, email) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PBR Community', 'pbr-community', 'The main PBR community organization', 'hello@pbr.com');

-- Insert organization memberships
INSERT INTO organization_memberships (user_id, organization_id, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin'),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member');

-- Insert sample event
INSERT INTO events (id, title, description, slug, status, organization_id, start_time, end_time, is_public) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PBR Meetup #1', 'Our first community meetup!', 'pbr-meetup-1', 'published', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 3 hours', true);

-- Insert sample activity
INSERT INTO activities (id, event_id, title, description, start_time, end_time, "order") VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Welcome & Introductions', 'Get to know the community', 
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 30 minutes', 1),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Main Discussion', 'Discuss PBR topics', 
     NOW() + INTERVAL '7 days 1 hour', NOW() + INTERVAL '7 days 2 hours', 2);

-- Insert sample chat thread
INSERT INTO chat_threads (id, name, description, type, organization_id) VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'General Chat', 'General community discussion', 'group', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Insert chat memberships
INSERT INTO chat_memberships (thread_id, user_id, role) VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'admin'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'member'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'member');

-- Insert sample chat message
INSERT INTO chat_messages (id, thread_id, user_id, content) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Welcome to the PBR community! 🎉');
