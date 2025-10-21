-- Fix notification system functions and permissions
-- Migration: 20250103000058_fix_notification_functions.sql

-- 1. Add missing created_by column to chat_threads table
ALTER TABLE chat_threads 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Drop and recreate the functions with proper error handling
DROP FUNCTION IF EXISTS send_notification_to_rsvps(UUID, VARCHAR, TEXT, UUID);
DROP FUNCTION IF EXISTS create_event_chat(UUID, VARCHAR, UUID);

-- 3. Create function to send notifications to all RSVP'd users
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to create event chat with all RSVP'd users
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant necessary permissions to the functions
GRANT EXECUTE ON FUNCTION send_notification_to_rsvps(UUID, VARCHAR, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_event_chat(UUID, VARCHAR, UUID) TO authenticated, service_role;
