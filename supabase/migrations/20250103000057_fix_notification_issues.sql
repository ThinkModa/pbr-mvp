-- Fix notification system issues
-- Migration: 20250103000057_fix_notification_issues.sql

-- 1. Add missing created_by column to chat_threads table
ALTER TABLE chat_threads 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Fix RLS policies to allow service role to create notifications
-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage scheduled notifications" ON scheduled_notifications;

-- Create new policies that allow service role (used by functions) to work
CREATE POLICY "Service role can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage scheduled notifications" ON scheduled_notifications
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Allow service role to insert into user_notifications
CREATE POLICY "Service role can create user notifications" ON user_notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    user_id = auth.uid()
  );

-- 4. Allow service role to insert into chat_threads
CREATE POLICY "Service role can create chat threads" ON chat_threads
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Allow service role to insert into chat_memberships
CREATE POLICY "Service role can create chat memberships" ON chat_memberships
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    user_id = auth.uid()
  );

-- 6. Update the create_event_chat function to handle the case where created_by might be null
CREATE OR REPLACE FUNCTION create_event_chat(
  p_event_id UUID,
  p_chat_name VARCHAR(255),
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  thread_id UUID;
  rsvp_record RECORD;
BEGIN
  -- Create the chat thread
  INSERT INTO chat_threads (name, type, thread_type, event_id, created_by)
  VALUES (p_chat_name, 'event', 'event', p_event_id, p_created_by)
  RETURNING id INTO thread_id;
  
  -- Add all RSVP'd users as members
  FOR rsvp_record IN 
    SELECT user_id FROM event_rsvps 
    WHERE event_id = p_event_id AND status = 'attending'
  LOOP
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at)
    VALUES (thread_id, rsvp_record.user_id, TRUE, NOW())
    ON CONFLICT (thread_id, user_id) DO NOTHING; -- Prevent duplicate memberships
  END LOOP;
  
  RETURN thread_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Update the send_notification_to_rsvps function to handle conflicts
CREATE OR REPLACE FUNCTION send_notification_to_rsvps(
  p_event_id UUID,
  p_title VARCHAR(255),
  p_content TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  rsvp_record RECORD;
BEGIN
  -- Create the notification
  INSERT INTO notifications (event_id, title, content, created_by)
  VALUES (p_event_id, p_title, p_content, p_created_by)
  RETURNING id INTO notification_id;
  
  -- Add notification to all RSVP'd users
  FOR rsvp_record IN 
    SELECT user_id FROM event_rsvps 
    WHERE event_id = p_event_id AND status = 'attending'
  LOOP
    INSERT INTO user_notifications (notification_id, user_id)
    VALUES (notification_id, rsvp_record.user_id)
    ON CONFLICT (notification_id, user_id) DO NOTHING; -- Prevent duplicate notifications
  END LOOP;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;
