-- Fix chat thread types to ensure proper filtering
-- Migration: 20250103000071_fix_chat_thread_types.sql

-- 1. Fix any direct message threads that don't have thread_type = 'dm'
UPDATE chat_threads 
SET thread_type = 'dm' 
WHERE type = 'dm' AND (thread_type IS NULL OR thread_type != 'dm');

-- 2. Fix any event threads that don't have thread_type = 'event'
UPDATE chat_threads 
SET thread_type = 'event' 
WHERE type = 'event' AND (thread_type IS NULL OR thread_type != 'event');

-- 3. Fix any group threads that don't have thread_type = 'group'
UPDATE chat_threads 
SET thread_type = 'group' 
WHERE type = 'group' AND (thread_type IS NULL OR thread_type != 'group');

-- 4. Fix any notification threads that don't have thread_type = 'notification'
UPDATE chat_threads 
SET thread_type = 'notification' 
WHERE is_notification = TRUE AND (thread_type IS NULL OR thread_type != 'notification');

-- 5. Add a comment for documentation
COMMENT ON COLUMN chat_threads.thread_type IS 'Thread classification: dm (direct messages), group (regular groups), event (event chats), notification (read-only notifications). Used for proper filtering in chat UI.';

