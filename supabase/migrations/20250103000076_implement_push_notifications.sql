-- Implement server-side push notifications
-- Migration: 20250103000068_implement_push_notifications.sql

-- 1. Add missing type column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'event_notification' 
CHECK (type IN ('event_notification', 'chat_message', 'new_chat_thread', 'event_reminder', 'event_starting', 'rsvp_reminder'));

-- 2. Create function to send push notifications via HTTP request
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_record RECORD;
  user_record RECORD;
  push_tokens TEXT[] := '{}';
  expo_push_url TEXT := 'https://exp.host/--/api/v2/push/send';
  payload JSONB;
  response TEXT;
BEGIN
  -- Get notification details
  SELECT n.*, e.title as event_title
  INTO notification_record
  FROM notifications n
  LEFT JOIN events e ON n.event_id = e.id
  WHERE n.id = NEW.id;
  
  -- Get all push tokens for users assigned to this notification
  FOR user_record IN 
    SELECT DISTINCT upt.push_token, upt.platform
    FROM user_notifications un
    JOIN user_push_tokens upt ON un.user_id = upt.user_id
    WHERE un.notification_id = NEW.id 
    AND upt.is_active = true
  LOOP
    push_tokens := push_tokens || user_record.push_token;
  END LOOP;
  
  -- Only send if we have push tokens
  IF array_length(push_tokens, 1) > 0 THEN
    -- Build Expo push notification payload
    payload := jsonb_build_object(
      'to', push_tokens,
      'title', notification_record.title,
      'body', notification_record.content,
      'data', jsonb_build_object(
        'notificationId', NEW.id,
        'eventId', notification_record.event_id,
        'type', COALESCE(notification_record.type, 'event_notification'),
        'eventTitle', notification_record.event_title
      ),
      'sound', 'default',
      'badge', 1
    );
    
    -- Send HTTP request to Expo Push API
    BEGIN
      SELECT content INTO response
      FROM http((
        'POST',
        expo_push_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        'application/json',
        payload::text
      ));
      
      -- Log the response (optional)
      RAISE LOG 'Push notification sent for notification %: %', NEW.id, response;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE LOG 'Failed to send push notification for notification %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to create chat message notifications
CREATE OR REPLACE FUNCTION create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  thread_record RECORD;
  sender_record RECORD;
  recipient_record RECORD;
  thread_members TEXT[] := '{}';
  member_id UUID;
BEGIN
  -- Get thread information
  SELECT ct.*, e.title as event_title
  INTO thread_record
  FROM chat_threads ct
  LEFT JOIN events e ON ct.event_id = e.id
  WHERE ct.id = NEW.thread_id;
  
  -- Get sender information
  SELECT u.name, u.email
  INTO sender_record
  FROM users u
  WHERE u.id = NEW.user_id;
  
  -- Skip if this is a system message or notification thread
  IF NEW.message_type = 'system' OR thread_record.is_notification = true THEN
    RETURN NEW;
  END IF;
  
  -- Get all thread members except the sender
  FOR member_id IN 
    SELECT cm.user_id
    FROM chat_memberships cm
    WHERE cm.thread_id = NEW.thread_id 
    AND cm.user_id != NEW.user_id
    AND cm.is_active = true
  LOOP
    thread_members := thread_members || member_id::text;
  END LOOP;
  
  -- Only create notification if there are other members
  IF array_length(thread_members, 1) > 0 THEN
    -- Create notification (use a default event for non-event chats)
    INSERT INTO notifications (event_id, title, content, created_by, type)
    VALUES (
      COALESCE(thread_record.event_id, '00000000-0000-0000-0000-000000000000'::uuid),
      CASE 
        WHEN thread_record.type = 'dm' THEN sender_record.name || ' sent you a message'
        WHEN thread_record.type = 'group' THEN sender_record.name || ' in ' || COALESCE(thread_record.name, 'Group Chat')
        WHEN thread_record.type = 'event' THEN sender_record.name || ' in ' || COALESCE(thread_record.event_title, 'Event Chat')
        ELSE sender_record.name || ' sent a message'
      END,
      CASE 
        WHEN length(NEW.content) > 100 THEN left(NEW.content, 97) || '...'
        ELSE NEW.content
      END,
      NEW.user_id,
      'chat_message'
    )
    RETURNING id INTO notification_id;
    
    -- Assign notification to all thread members except sender
    FOR member_id IN 
      SELECT unnest(thread_members)::uuid
    LOOP
      INSERT INTO user_notifications (notification_id, user_id)
      VALUES (notification_id, member_id)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to create new chat thread notifications
CREATE OR REPLACE FUNCTION create_chat_thread_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  creator_record RECORD;
  member_id UUID;
  thread_members TEXT[] := '{}';
BEGIN
  -- Skip notification threads
  IF NEW.is_notification = true THEN
    RETURN NEW;
  END IF;
  
  -- Get creator information
  SELECT u.name, u.email
  INTO creator_record
  FROM users u
  WHERE u.id = NEW.created_by;
  
  -- Get all thread members except the creator
  FOR member_id IN 
    SELECT cm.user_id
    FROM chat_memberships cm
    WHERE cm.thread_id = NEW.id 
    AND cm.user_id != NEW.created_by
    AND cm.is_active = true
  LOOP
    thread_members := thread_members || member_id::text;
  END LOOP;
  
  -- Only create notification if there are other members
  IF array_length(thread_members, 1) > 0 THEN
    -- Create notification (use a default event for non-event chats)
    INSERT INTO notifications (event_id, title, content, created_by, type)
    VALUES (
      COALESCE(NEW.event_id, '00000000-0000-0000-0000-000000000000'::uuid),
      CASE 
        WHEN NEW.type = 'dm' THEN creator_record.name || ' started a conversation with you'
        WHEN NEW.type = 'group' THEN creator_record.name || ' added you to "' || COALESCE(NEW.name, 'Group Chat') || '"'
        WHEN NEW.type = 'event' THEN creator_record.name || ' added you to "' || COALESCE(NEW.name, 'Event Chat') || '"'
        ELSE creator_record.name || ' added you to a chat'
      END,
      CASE 
        WHEN NEW.description IS NOT NULL AND length(NEW.description) > 100 THEN left(NEW.description, 97) || '...'
        WHEN NEW.description IS NOT NULL THEN NEW.description
        ELSE 'You have been added to a new chat thread.'
      END,
      NEW.created_by,
      'new_chat_thread'
    )
    RETURNING id INTO notification_id;
    
    -- Assign notification to all thread members except creator
    FOR member_id IN 
      SELECT unnest(thread_members)::uuid
    LOOP
      INSERT INTO user_notifications (notification_id, user_id)
      VALUES (notification_id, member_id)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers
-- Trigger for push notifications when notifications are created
DROP TRIGGER IF EXISTS send_push_notification_trigger ON notifications;
CREATE TRIGGER send_push_notification_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification();

-- Trigger for chat message notifications
DROP TRIGGER IF EXISTS create_chat_notification_trigger ON chat_messages;
CREATE TRIGGER create_chat_notification_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notification();

-- Trigger for new chat thread notifications
DROP TRIGGER IF EXISTS create_chat_thread_notification_trigger ON chat_threads;
CREATE TRIGGER create_chat_thread_notification_trigger
  AFTER INSERT ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_thread_notification();

-- 6. Enable HTTP extension for making API calls
CREATE EXTENSION IF NOT EXISTS http;

-- 7. Add comments for documentation
COMMENT ON FUNCTION send_push_notification() IS 'Sends push notifications via Expo API when notifications are created';
COMMENT ON FUNCTION create_chat_notification() IS 'Creates notifications for new chat messages';
COMMENT ON FUNCTION create_chat_thread_notification() IS 'Creates notifications for new chat threads';
COMMENT ON TRIGGER send_push_notification_trigger ON notifications IS 'Triggers push notification sending when notifications are created';
COMMENT ON TRIGGER create_chat_notification_trigger ON chat_messages IS 'Triggers chat message notifications when messages are sent';
COMMENT ON TRIGGER create_chat_thread_notification_trigger ON chat_threads IS 'Triggers new chat thread notifications when threads are created';
