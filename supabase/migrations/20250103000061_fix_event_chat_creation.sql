-- Fix event chat creation to always create chat and add creator
-- Migration: 20250103000061_fix_event_chat_creation.sql

-- 1. Update create_event_chat function to always create chat and add creator
CREATE OR REPLACE FUNCTION create_event_chat(
  p_event_id UUID,
  p_chat_name VARCHAR(255),
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
  rsvp_record RECORD;
BEGIN
  -- Create the chat thread with proper thread_type (always create, regardless of RSVPs)
  INSERT INTO chat_threads (name, type, thread_type, event_id, created_by, is_notification)
  VALUES (p_chat_name, 'event', 'event', p_event_id, p_created_by, FALSE)
  RETURNING id INTO v_thread_id;
  
  -- Always add the creator as a member (so they can see and manage the chat)
  INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at, role)
  VALUES (v_thread_id, p_created_by, TRUE, NOW(), 'admin')
  ON CONFLICT (thread_id, user_id) DO NOTHING;
  
  -- Add any existing RSVP'd users as members (if any exist)
  FOR rsvp_record IN 
    SELECT user_id FROM event_rsvps 
    WHERE event_id = p_event_id AND status = 'attending'
  LOOP
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at, role)
    VALUES (v_thread_id, rsvp_record.user_id, TRUE, NOW(), 'member')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END LOOP;
  
  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify the trigger for adding future RSVPs exists and is working
-- (This should already exist from previous migrations, but let's make sure it's correct)
CREATE OR REPLACE FUNCTION add_rsvp_to_event_chats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a new RSVP with 'attending' status
  IF NEW.status = 'attending' AND (OLD IS NULL OR OLD.status != 'attending') THEN
    -- Find all event chats for this event and add the user
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at, role)
    SELECT ct.id, NEW.user_id, TRUE, NOW(), 'member'
    FROM chat_threads ct
    WHERE ct.event_id = NEW.event_id AND ct.thread_type = 'event'
    ON CONFLICT (thread_id, user_id) DO NOTHING; -- Prevent duplicate memberships
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure the trigger exists (drop and recreate to be sure)
DROP TRIGGER IF EXISTS trigger_add_rsvp_to_event_chats ON event_rsvps;
CREATE TRIGGER trigger_add_rsvp_to_event_chats
  AFTER INSERT OR UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION add_rsvp_to_event_chats();

-- 4. Add comments for documentation
COMMENT ON FUNCTION create_event_chat IS 'Creates an event chat thread and adds creator + any existing RSVPs. Future RSVPs are added automatically via trigger.';
COMMENT ON FUNCTION add_rsvp_to_event_chats IS 'Automatically adds new RSVPs to existing event chats';
