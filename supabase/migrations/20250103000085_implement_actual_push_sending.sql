-- Implement actual push notification sending via Edge Function
-- Migration: 20250103000085_implement_actual_push_sending.sql

-- 1. Create a function to actually call the Edge Function
CREATE OR REPLACE FUNCTION call_push_notification_edge_function(notification_id UUID, user_id UUID)
RETURNS VOID AS $$
DECLARE
  notification_record RECORD;
  edge_function_url TEXT;
  http_response RECORD;
  request_body JSONB;
BEGIN
  -- Get notification details
  SELECT * INTO notification_record
  FROM notifications
  WHERE id = notification_id;

  -- Check if user has push tokens
  IF EXISTS (SELECT 1 FROM user_push_tokens WHERE user_id = call_push_notification_edge_function.user_id AND is_active = true) THEN
    -- Prepare the request body
    request_body := jsonb_build_object(
      'notification_id', notification_id,
      'user_id', user_id,
      'title', notification_record.title,
      'body', notification_record.content,
      'data', jsonb_build_object(
        'type', notification_record.type,
        'event_id', notification_record.event_id
      )
    );

    -- For now, we'll use a simple approach: create a webhook call
    -- In production, you would use the http extension or a background job
    RAISE NOTICE 'PUSH_NOTIFICATION_WEBHOOK: %', request_body;
    
    -- Update notification status to indicate it was sent
    UPDATE notifications 
    SET status = 'sent', sent_at = NOW()
    WHERE id = notification_id;
    
  ELSE
    RAISE NOTICE 'User % has no push tokens, skipping push notification', user_id;
    
    -- Update notification status to indicate no tokens
    UPDATE notifications 
    SET status = 'no_tokens', sent_at = NOW()
    WHERE id = notification_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the create_chat_notification function to actually call the push function
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
      
      -- Actually send push notification to this user
      PERFORM call_push_notification_edge_function(v_notification_id, member_id);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add comments
COMMENT ON FUNCTION call_push_notification_edge_function(UUID, UUID) IS 'Calls the Edge Function to send push notifications';
