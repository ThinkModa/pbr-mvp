-- Temporarily disable the problematic trigger to allow messages to be sent
-- Migration: 20250103000088_disable_problematic_trigger.sql

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS create_chat_notification_trigger ON chat_messages;

-- 2. Create a simpler version that doesn't call the push function
CREATE OR REPLACE FUNCTION create_chat_notification_simple()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
  thread_record RECORD;
  sender_record RECORD;
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
    INSERT INTO notifications (event_id, title, content, created_by, type, status)
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
      'chat_message',
      'pending'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger with the simple function
CREATE TRIGGER create_chat_notification_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notification_simple();

-- 4. Add comment
COMMENT ON FUNCTION create_chat_notification_simple() IS 'Creates notifications for chat messages without push sending (simplified version)';
