-- Final fix for send_notification_to_rsvps function with proper column references
-- Migration: 20250103000066_fix_notification_function_final.sql

-- Drop the existing function completely
DROP FUNCTION IF EXISTS send_notification_to_rsvps(UUID, VARCHAR, TEXT, UUID);

-- Create a clean version of the function with explicit column references
CREATE OR REPLACE FUNCTION send_notification_to_rsvps(
  p_event_id UUID,
  p_title VARCHAR(255),
  p_content TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_thread_id UUID;
  rsvp_record RECORD;
  event_record RECORD;
BEGIN
  -- Get event information
  SELECT events.title INTO event_record FROM events WHERE events.id = p_event_id;
  
  -- Create the notification
  INSERT INTO notifications (event_id, title, content, created_by)
  VALUES (p_event_id, p_title, p_content, p_created_by)
  RETURNING notifications.id INTO v_notification_id;
  
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
  RETURNING chat_threads.id INTO v_thread_id;
  
  -- Add the notification content as the first message in the thread
  INSERT INTO chat_messages (thread_id, user_id, content, message_type)
  VALUES (v_thread_id, p_created_by, p_content, 'text');
  
  -- Add the creator to the chat thread membership first
  INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at)
  VALUES (v_thread_id, p_created_by, TRUE, NOW())
  ON CONFLICT (thread_id, user_id) DO NOTHING;
  
  -- Add notification to all RSVP'd users and add them to the chat thread
  FOR rsvp_record IN 
    SELECT event_rsvps.user_id FROM event_rsvps 
    WHERE event_rsvps.event_id = p_event_id AND event_rsvps.status = 'attending'
  LOOP
    -- Add to user_notifications
    INSERT INTO user_notifications (notification_id, user_id)
    VALUES (v_notification_id, rsvp_record.user_id)
    ON CONFLICT (notification_id, user_id) DO NOTHING;
    
    -- Add to chat thread membership
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at)
    VALUES (v_thread_id, rsvp_record.user_id, TRUE, NOW())
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END LOOP;
  
  -- Update thread's last_message_at with explicit table reference
  UPDATE chat_threads 
  SET last_message_at = NOW() 
  WHERE chat_threads.id = v_thread_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION send_notification_to_rsvps IS 'Creates a notification and a corresponding chat thread for event attendees, including the creator. All column references are explicit to avoid ambiguity.';
