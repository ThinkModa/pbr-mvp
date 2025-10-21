-- Fix existing direct message threads to have correct thread_type
-- Migration: 20250103000062_fix_existing_dm_thread_types.sql

-- Update existing direct message threads to have thread_type = 'dm'
UPDATE chat_threads 
SET thread_type = 'dm' 
WHERE type = 'dm' AND thread_type = 'group';

-- Update existing event threads to have thread_type = 'event' 
UPDATE chat_threads 
SET thread_type = 'event' 
WHERE type = 'event' AND thread_type = 'group';

-- Add comment for documentation
COMMENT ON COLUMN chat_threads.thread_type IS 'Type of chat thread: group, dm, event, notification. Used for filtering in UI.';
