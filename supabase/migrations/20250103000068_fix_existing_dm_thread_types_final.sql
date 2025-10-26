-- Fix existing direct message thread types to ensure proper filtering
-- Migration: 20250103000068_fix_existing_dm_thread_types_final.sql

-- Update existing direct message threads to have thread_type = 'dm'
UPDATE chat_threads
SET thread_type = 'dm'
WHERE type = 'dm' AND (thread_type IS NULL OR thread_type != 'dm');

-- Update existing event threads to have thread_type = 'event'
UPDATE chat_threads
SET thread_type = 'event'
WHERE type = 'event' AND (thread_type IS NULL OR thread_type != 'event');

-- Ensure 'group' type threads explicitly have 'group' thread_type
UPDATE chat_threads
SET thread_type = 'group'
WHERE type = 'group' AND (thread_type IS NULL OR thread_type != 'group');

-- Add a comment for documentation
COMMENT ON COLUMN chat_threads.thread_type IS 'Thread classification: dm (direct messages), group (regular groups), event (event chats), notification (read-only notifications)';

