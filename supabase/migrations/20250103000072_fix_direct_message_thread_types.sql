-- Fix direct message thread types to ensure they appear in Direct tab
-- Migration: 20250103000072_fix_direct_message_thread_types.sql

-- This migration specifically fixes the issue where direct messages
-- between test user and Rod Walton appear in Groups instead of Direct tab

-- 1. First, let's see what direct message threads exist
-- (This is just for debugging - will be commented out in production)

-- SELECT 
--     ct.id,
--     ct.name,
--     ct.type,
--     ct.thread_type,
--     ct.is_private,
--     ct.created_at,
--     array_agg(u.email) as member_emails
-- FROM chat_threads ct
-- JOIN chat_memberships cm ON ct.id = cm.thread_id
-- JOIN users u ON cm.user_id = u.id
-- WHERE ct.type = 'dm'
-- GROUP BY ct.id, ct.name, ct.type, ct.thread_type, ct.is_private, ct.created_at
-- ORDER BY ct.created_at DESC;

-- 2. Fix ALL direct message threads to have thread_type = 'dm'
UPDATE chat_threads 
SET thread_type = 'dm' 
WHERE type = 'dm' AND (thread_type IS NULL OR thread_type != 'dm');

-- 3. Ensure all direct message threads are marked as private
UPDATE chat_threads 
SET is_private = true 
WHERE type = 'dm' AND is_private = false;

-- 4. Add a comment for documentation
COMMENT ON COLUMN chat_threads.thread_type IS 'Thread classification: dm (direct messages), group (regular groups), event (event chats), notification (read-only notifications). Used for proper filtering in chat UI.';

-- 5. Verify the fix by ensuring all dm threads have correct thread_type
-- This will help identify any remaining issues
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM chat_threads 
        WHERE type = 'dm' AND (thread_type IS NULL OR thread_type != 'dm')
    ) THEN
        RAISE EXCEPTION 'Some direct message threads still have incorrect thread_type';
    END IF;
END $$;

