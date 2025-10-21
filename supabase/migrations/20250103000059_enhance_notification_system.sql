-- Enhance notification system to create chat threads
-- Migration: 20250103000059_enhance_notification_system.sql

-- 1. Update send_notification_to_rsvps function to create notification chat threads
CREATE OR REPLACE FUNCTION send_notification_to_rsvps(
  p_event_id UUID,
  p_title VARCHAR(255),
  p_content TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  thread_id UUID;
  rsvp_record RECORD;
  event_record RECORD;
BEGIN
  -- Get event information
  SELECT title INTO event_record FROM events WHERE id = p_event_id;
  
  -- Create the notification
  INSERT INTO notifications (event_id, title, content, created_by)
  VALUES (p_event_id, p_title, p_content, p_created_by)
  RETURNING id INTO notification_id;
  
  -- Create a notification chat thread
  INSERT INTO chat_threads (name, type, thread_type, event_id, created_by, is_notification)
  VALUES (
    'Event Notification: ' || COALESCE(event_record.title, 'Unknown Event'),
    'event',
    'notification',
    p_event_id,
    p_created_by,
    TRUE
  )
  RETURNING id INTO thread_id;
  
  -- Add the notification content as the first message in the thread
  INSERT INTO chat_messages (thread_id, user_id, content, message_type)
  VALUES (thread_id, p_created_by, p_content, 'text');
  
  -- Add notification to all RSVP'd users and add them to the chat thread
  FOR rsvp_record IN 
    SELECT user_id FROM event_rsvps 
    WHERE event_id = p_event_id AND status = 'attending'
  LOOP
    -- Add to user_notifications
    INSERT INTO user_notifications (notification_id, user_id)
    VALUES (notification_id, rsvp_record.user_id)
    ON CONFLICT (notification_id, user_id) DO NOTHING;
    
    -- Add to chat thread membership
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at)
    VALUES (thread_id, rsvp_record.user_id, TRUE, NOW())
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END LOOP;
  
  -- Update thread's last_message_at
  UPDATE chat_threads 
  SET last_message_at = NOW() 
  WHERE id = thread_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update create_event_chat function to ensure proper thread_type
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
  -- Create the chat thread with proper thread_type
  INSERT INTO chat_threads (name, type, thread_type, event_id, created_by, is_notification)
  VALUES (p_chat_name, 'event', 'event', p_event_id, p_created_by, FALSE)
  RETURNING id INTO thread_id;
  
  -- Add all RSVP'd users as members
  FOR rsvp_record IN 
    SELECT user_id FROM event_rsvps 
    WHERE event_id = p_event_id AND status = 'attending'
  LOOP
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at)
    VALUES (thread_id, rsvp_record.user_id, TRUE, NOW())
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END LOOP;
  
  RETURN thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add comments for documentation
COMMENT ON FUNCTION send_notification_to_rsvps IS 'Creates a notification and a corresponding chat thread for all RSVP''d users';
COMMENT ON FUNCTION create_event_chat IS 'Creates an event chat thread with all RSVP''d users as members';
