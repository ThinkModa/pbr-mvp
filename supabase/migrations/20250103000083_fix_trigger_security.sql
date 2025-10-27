-- Fix trigger functions to run with elevated privileges
-- Migration: 20250103000083_fix_trigger_security.sql

-- 1. Drop existing triggers
DROP TRIGGER IF EXISTS create_chat_notification_trigger ON chat_messages;
DROP TRIGGER IF EXISTS create_chat_thread_notification_trigger ON chat_threads;

-- 2. Recreate the chat notification function with SECURITY DEFINER
-- This makes the function run with the privileges of the function owner (service role)
CREATE OR REPLACE FUNCTION create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
  thread_record RECORD;
  sender_record RECORD;
  recipient_record RECORD;
  thread_members TEXT[] := '{}';
  member_id UUID;
BEGIN
  -- Skip system messages
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- Get thread information
  SELECT ct.*, e.title as event_title
  INTO thread_record
  FROM chat_threads ct
  LEFT JOIN events e ON ct.event_id = e.id
  WHERE ct.id = NEW.thread_id;

  -- Skip notification threads
  IF thread_record.is_notification = true THEN
    RETURN NEW;
  END IF;

  -- Get sender information
  SELECT u.name, u.email
  INTO sender_record
  FROM users u
  WHERE u.id = NEW.user_id;

  -- Get all members of the thread except the sender
  FOR member_id IN
    SELECT cm.user_id
    FROM chat_memberships cm
    WHERE cm.thread_id = NEW.thread_id AND cm.user_id != NEW.user_id
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
    RETURNING id INTO v_notification_id;
    
    -- Assign notification to all thread members except sender
    FOR member_id IN 
      SELECT unnest(thread_members)::uuid
    LOOP
      INSERT INTO user_notifications (notification_id, user_id)
      VALUES (v_notification_id, member_id)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- This is the key change

-- 3. Recreate the chat thread notification function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_chat_thread_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
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

  -- Get all members of the new thread except the creator
  FOR member_id IN
    SELECT cm.user_id
    FROM chat_memberships cm
    WHERE cm.thread_id = NEW.id AND cm.user_id != NEW.created_by
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
        WHEN NEW.type = 'group' THEN creator_record.name || ' added you to \"' || COALESCE(NEW.name, 'Group Chat') || '\"'
        WHEN NEW.type = 'event' THEN creator_record.name || ' added you to \"' || COALESCE(NEW.name, 'Event Chat') || '\"'
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
    RETURNING id INTO v_notification_id;
    
    -- Assign notification to all thread members except creator
    FOR member_id IN 
      SELECT unnest(thread_members)::uuid
    LOOP
      INSERT INTO user_notifications (notification_id, user_id)
      VALUES (v_notification_id, member_id)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- This is the key change

-- 4. Recreate the triggers
CREATE TRIGGER create_chat_notification_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notification();

CREATE TRIGGER create_chat_thread_notification_trigger
  AFTER INSERT ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_thread_notification();

-- 5. Add comments
COMMENT ON FUNCTION create_chat_notification() IS 'Creates notifications for chat messages with elevated privileges';
COMMENT ON FUNCTION create_chat_thread_notification() IS 'Creates notifications for new chat threads with elevated privileges';
