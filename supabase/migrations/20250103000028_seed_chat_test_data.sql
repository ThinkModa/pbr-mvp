-- Seed test data for chat system
-- This creates sample users, threads, and messages for testing

-- First, let's create some test users if they don't exist
INSERT INTO users (id, email, name, role, avatar_url, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'Alice Johnson', 'general', null, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'bob@example.com', 'Bob Smith', 'general', null, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'carol@example.com', 'Carol Davis', 'general', null, NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'david@example.com', 'David Wilson', 'general', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chat threads
INSERT INTO chat_threads (id, name, description, type, is_private, event_id, created_at, updated_at, last_message_at)
VALUES 
    -- Event announcement thread
    ('11111111-1111-1111-1111-111111111111', 'PBR Meetup #1 Announcements', 'Official announcements for PBR Meetup #1', 'event', false, 
     (SELECT id FROM events WHERE title = 'PBR Meetup #1' LIMIT 1), 
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    
    -- Group chat thread
    ('22222222-2222-2222-2222-222222222222', 'PBR Community Chat', 'General discussion for PBR community members', 'group', false, null,
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
    
    -- Direct message thread
    ('33333333-3333-3333-3333-333333333333', null, null, 'dm', true, null,
     NOW() - INTERVAL '3 hours', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes');

-- Create chat memberships
INSERT INTO chat_memberships (thread_id, user_id, role, unread_count, last_read_at, joined_at)
VALUES 
    -- Event thread memberships (all users)
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'member', 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member', 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'member', 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'member', 2, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 days'),
    
    -- Group chat memberships
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin', 0, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '1 day'),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'member', 1, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 day'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'member', 0, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '1 day'),
    
    -- Direct message memberships (Alice and Bob)
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'member', 0, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '3 hours'),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'member', 1, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '3 hours');

-- Create test messages
INSERT INTO chat_messages (id, thread_id, user_id, content, message_type, created_at)
VALUES 
    -- Event announcement messages
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
     (SELECT id FROM users WHERE email = 'admin@pbr.com' LIMIT 1), 
     'Welcome to PBR Meetup #1! We have an exciting lineup of speakers and activities planned.', 'text', 
     NOW() - INTERVAL '2 days'),
    
    ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 
     (SELECT id FROM users WHERE email = 'admin@pbr.com' LIMIT 1), 
     'Don''t forget to RSVP and check out the agenda in the mobile app!', 'text', 
     NOW() - INTERVAL '1 day'),
    
    ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 
     (SELECT id FROM users WHERE email = 'admin@pbr.com' LIMIT 1), 
     'Event starts at 6:00 PM. See you there! 🎉', 'text', 
     NOW() - INTERVAL '1 hour'),
    
    -- Group chat messages
    ('22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 
     '11111111-1111-1111-1111-111111111111', 
     'Hey everyone! Welcome to the PBR community chat!', 'text', 
     NOW() - INTERVAL '1 day'),
    
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 
     '22222222-2222-2222-2222-222222222222', 
     'Thanks for setting this up, Alice!', 'text', 
     NOW() - INTERVAL '23 hours'),
    
    ('22222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 
     '33333333-3333-3333-3333-333333333333', 
     'Looking forward to connecting with everyone!', 'text', 
     NOW() - INTERVAL '30 minutes'),
    
    -- Direct message between Alice and Bob
    ('33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 
     '11111111-1111-1111-1111-111111111111', 
     'Hey Bob! How are you doing?', 'text', 
     NOW() - INTERVAL '3 hours'),
    
    ('33333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 
     '22222222-2222-2222-2222-222222222222', 
     'Hi Alice! I''m doing great, thanks for asking. How about you?', 'text', 
     NOW() - INTERVAL '2 hours'),
    
    ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 
     '11111111-1111-1111-1111-111111111111', 
     'I''m excited about the PBR meetup next week!', 'text', 
     NOW() - INTERVAL '10 minutes');
