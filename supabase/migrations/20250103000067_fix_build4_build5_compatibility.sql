-- Fix database schema for Build 4/5 compatibility
-- Migration: 20250103000067_fix_build4_build5_compatibility.sql

-- 1. Add notification_preferences column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'notification_preferences'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN notification_preferences JSONB DEFAULT '{
            "push_enabled": true,
            "events_enabled": true,
            "chat_enabled": true
        }';
        
        RAISE NOTICE 'Added notification_preferences column to users table';
    ELSE
        RAISE NOTICE 'notification_preferences column already exists in users table';
    END IF;
END $$;

-- 2. Add thread_type column to chat_threads table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_threads' 
        AND column_name = 'thread_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE chat_threads 
        ADD COLUMN thread_type VARCHAR(20) DEFAULT 'group' 
        CHECK (thread_type IN ('group', 'dm', 'event', 'notification'));
        
        RAISE NOTICE 'Added thread_type column to chat_threads table';
    ELSE
        RAISE NOTICE 'thread_type column already exists in chat_threads table';
    END IF;
END $$;

-- 3. Update existing direct message threads to have correct thread_type
UPDATE chat_threads 
SET thread_type = 'dm' 
WHERE type = 'dm' AND (thread_type IS NULL OR thread_type != 'dm');

-- 4. Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Add created_by column to chat_threads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_threads' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE chat_threads 
        ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added created_by column to chat_threads table';
    ELSE
        RAISE NOTICE 'created_by column already exists in chat_threads table';
    END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_thread_type ON chat_threads(thread_type);
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences ON users USING GIN(notification_preferences);

-- 7. Add comments for documentation
COMMENT ON COLUMN users.notification_preferences IS 'User notification preferences for push notifications';
COMMENT ON COLUMN chat_threads.thread_type IS 'Type of thread: group, dm, event, or notification';
COMMENT ON COLUMN chat_threads.created_by IS 'User who created the thread';

