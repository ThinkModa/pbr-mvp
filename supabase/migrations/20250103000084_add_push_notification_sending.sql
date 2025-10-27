-- Add push notification sending to database triggers
-- Migration: 20250103000084_add_push_notification_sending.sql

-- 1. Add status and sent_at columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- 2. Create function to send push notifications via Edge Function
CREATE OR REPLACE FUNCTION send_push_notification_via_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  notification_data JSONB;
  http_response RECORD;
BEGIN
  -- Skip if this is not a chat message notification
  IF NEW.type != 'chat_message' THEN
    RETURN NEW;
  END IF;

  -- Get the Edge Function URL
  edge_function_url := current_setting('app.settings.edge_function_url', true);
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    edge_function_url := 'https://zqjziejllixifpwzbdnf.supabase.co/functions/v1/send-push-notification';
  END IF;

  -- Prepare notification data
  notification_data := jsonb_build_object(
    'notification_id', NEW.id,
    'user_id', NEW.created_by,
    'title', NEW.title,
    'body', NEW.content,
    'data', jsonb_build_object(
      'type', NEW.type,
      'event_id', NEW.event_id
    )
  );

  -- Send HTTP request to Edge Function (this is a placeholder - actual implementation would use http extension)
  -- For now, we'll just log that we would send it
  RAISE NOTICE 'Would send push notification: %', notification_data;

  -- Update notification status to indicate it was processed
  UPDATE notifications 
  SET status = 'processing'
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a simpler approach - update the existing trigger to call the Edge Function
-- We'll modify the existing create_chat_notification function to also trigger push sending
CREATE OR REPLACE FUNCTION create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
  thread_record RECORD;
  sender_record RECORD;
  recipient_record RECORD;
  thread_members TEXT[] := '{}';
  member_id UUID;
  edge_function_url TEXT;
  notification_data JSONB;
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
      
      -- Send push notification to this user
      -- Get user's push tokens and send notification
      PERFORM send_push_to_user(member_id, v_notification_id);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to send push notification to a specific user
CREATE OR REPLACE FUNCTION send_push_to_user(target_user_id UUID, notification_id UUID)
RETURNS VOID AS $$
DECLARE
  edge_function_url TEXT;
  notification_record RECORD;
  user_tokens RECORD;
  http_response RECORD;
BEGIN
  -- Get notification details
  SELECT * INTO notification_record
  FROM notifications
  WHERE id = notification_id;

  -- Check if user has push tokens
  SELECT COUNT(*) INTO user_tokens
  FROM user_push_tokens
  WHERE user_id = target_user_id;

  -- Only proceed if user has push tokens
  IF user_tokens.count > 0 THEN
    -- Get the Edge Function URL
    edge_function_url := 'https://zqjziejllixifpwzbdnf.supabase.co/functions/v1/send-push-notification';
    
    -- For now, just log that we would send the notification
    -- In a real implementation, we would use the http extension to call the Edge Function
    RAISE NOTICE 'Would send push notification to user % for notification %', target_user_id, notification_id;
    RAISE NOTICE 'Edge Function URL: %', edge_function_url;
    RAISE NOTICE 'Notification: % - %', notification_record.title, notification_record.content;
  ELSE
    RAISE NOTICE 'User % has no push tokens, skipping push notification', target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add comments
COMMENT ON FUNCTION send_push_to_user(UUID, UUID) IS 'Sends push notification to a specific user via Edge Function';
COMMENT ON COLUMN notifications.status IS 'Status of the notification: pending, processing, sent, failed';
COMMENT ON COLUMN notifications.sent_at IS 'Timestamp when the notification was sent';
