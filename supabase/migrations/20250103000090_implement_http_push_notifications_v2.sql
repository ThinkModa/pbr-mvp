-- Implement proper HTTP push notifications from PostgreSQL triggers (v2)
-- Migration: 20250103000090_implement_http_push_notifications_v2.sql

-- 1. Drop the existing trigger and functions
DROP TRIGGER IF EXISTS create_chat_notification_trigger ON chat_messages;
DROP FUNCTION IF EXISTS create_chat_notification_simple();
DROP FUNCTION IF EXISTS create_chat_notification();

-- 2. Create a function to send push notifications via HTTP
CREATE OR REPLACE FUNCTION send_push_notification_http(
  notification_id UUID,
  target_user_id UUID,
  title TEXT,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
  edge_function_url TEXT;
  request_body JSONB;
  http_response RECORD;
  service_role_key TEXT;
BEGIN
  -- Get the Edge Function URL
  edge_function_url := 'https://zqjziejllixifpwzbdnf.supabase.co/functions/v1/send-push-notification';
  
  -- Get service role key from environment or use hardcoded value
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';
  
  -- Prepare the request body
  request_body := jsonb_build_object(
    'notification_id', notification_id,
    'user_id', target_user_id,
    'title', title,
    'body', body,
    'data', data
  );
  
  -- Make HTTP request to Edge Function
  SELECT * INTO http_response FROM http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    request_body::text
  ));
  
  -- Log the response
  RAISE NOTICE 'Push notification HTTP response: %', http_response;
  
  -- Update notification status based on response
  IF http_response.status = 200 THEN
    UPDATE notifications 
    SET status = 'sent', sent_at = NOW()
    WHERE id = notification_id;
  ELSE
    UPDATE notifications 
    SET status = 'failed', sent_at = NOW()
    WHERE id = notification_id;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and mark notification as failed
    RAISE NOTICE 'Error sending push notification: %', SQLERRM;
    UPDATE notifications 
    SET status = 'failed', sent_at = NOW()
    WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the main chat notification function that calls HTTP push
CREATE OR REPLACE FUNCTION create_chat_notification()
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
    
    -- Assign notification to all thread members except sender and send push notifications
    FOR member_id IN 
      SELECT unnest(thread_members)::uuid
    LOOP
      INSERT INTO user_notifications (notification_id, user_id)
      VALUES (v_notification_id, member_id)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
      
      -- Send push notification via HTTP
      PERFORM send_push_notification_http(
        v_notification_id,
        member_id,
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
        jsonb_build_object(
          'type', 'chat_message',
          'event_id', COALESCE(thread_record.event_id, '00000000-0000-0000-0000-000000000000'::uuid),
          'thread_id', NEW.thread_id,
          'message_id', NEW.id
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
CREATE TRIGGER create_chat_notification_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notification();

-- 5. Add comments
COMMENT ON FUNCTION create_chat_notification() IS 'Creates notifications and sends push notifications via HTTP for chat messages';
COMMENT ON FUNCTION send_push_notification_http(UUID, UUID, TEXT, TEXT, JSONB) IS 'Sends push notifications via HTTP request to Edge Function';
