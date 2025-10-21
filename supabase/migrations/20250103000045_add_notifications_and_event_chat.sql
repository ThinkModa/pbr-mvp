-- Add notifications and event chat functionality
-- Migration: 20250103000045_add_notifications_and_event_chat.sql

-- 1. Add columns to chat_threads table for event chat support
ALTER TABLE chat_threads 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS thread_type VARCHAR(20) DEFAULT 'group' CHECK (thread_type IN ('group', 'dm', 'event', 'notification')),
ADD COLUMN IF NOT EXISTS is_notification BOOLEAN DEFAULT FALSE;

-- 2. Create notifications table for app-wide notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_notifications table to track which users received notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- 4. Create notification_templates table for scheduled notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  content_template TEXT NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('event_created', 'event_reminder_24h', 'event_reminder_48h', 'event_starting_1h', 'rsvp_reminder', 'event_cancelled', 'event_updated')),
  trigger_offset_hours INTEGER DEFAULT 0, -- Hours before/after event (negative for before, positive for after)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create scheduled_notifications table for managing scheduled notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_push_tokens table for storing push notification tokens
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  push_token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_event_id ON chat_threads(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_thread_type ON chat_threads(thread_type);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_event_id ON scheduled_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON user_push_tokens(platform);

-- 8. Insert default notification templates
INSERT INTO notification_templates (name, title_template, content_template, trigger_type, trigger_offset_hours) VALUES
('event_created', 'New Event: {{event_title}}', 'A new event "{{event_title}}" has been created. Check it out and RSVP!', 'event_created', 0),
('event_reminder_24h', 'Event Tomorrow: {{event_title}}', 'Don''t forget! "{{event_title}}" is happening tomorrow at {{event_time}}.', 'event_reminder_24h', -24),
('event_reminder_48h', 'Event in 2 Days: {{event_title}}', 'Just a reminder that "{{event_title}}" is coming up in 2 days. Make sure you''re ready!', 'event_reminder_48h', -48),
('event_starting_1h', 'Event Starting Soon: {{event_title}}', '{{event_title}} starts in 1 hour! See you there!', 'event_starting_1h', -1),
('rsvp_reminder', 'RSVP Reminder: {{event_title}}', 'Don''t forget to RSVP for "{{event_title}}" happening on {{event_date}}.', 'rsvp_reminder', -48),
('event_cancelled', 'Event Cancelled: {{event_title}}', 'Unfortunately, "{{event_title}}" has been cancelled. We apologize for any inconvenience.', 'event_cancelled', 0),
('event_updated', 'Event Updated: {{event_title}}', 'The details for "{{event_title}}" have been updated. Please check the new information.', 'event_updated', 0)
ON CONFLICT (name) DO NOTHING;

-- 9. Create function to automatically add new RSVPs to event chats
CREATE OR REPLACE FUNCTION add_rsvp_to_event_chats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a new RSVP with 'attending' status
  IF NEW.status = 'attending' AND (OLD IS NULL OR OLD.status != 'attending') THEN
    -- Find all event chats for this event
    INSERT INTO chat_memberships (thread_id, user_id, is_active, joined_at)
    SELECT ct.id, NEW.user_id, TRUE, NOW()
    FROM chat_threads ct
    WHERE ct.event_id = NEW.event_id 
      AND ct.thread_type = 'event'
      AND ct.id NOT IN (
        SELECT thread_id 
        FROM chat_memberships 
        WHERE user_id = NEW.user_id AND thread_id = ct.id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically add RSVPs to event chats
DROP TRIGGER IF EXISTS trigger_add_rsvp_to_event_chats ON event_rsvps;
CREATE TRIGGER trigger_add_rsvp_to_event_chats
  AFTER INSERT OR UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION add_rsvp_to_event_chats();

-- 11. Create function to send notifications to all RSVP'd users
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
    VALUES (notification_id, rsvp_record.user_id);
  END LOOP;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to create event chat with all RSVP'd users
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
    VALUES (thread_id, rsvp_record.user_id, TRUE, NOW());
  END LOOP;
  
  RETURN thread_id;
END;
$$ LANGUAGE plpgsql;

-- 13. Add RLS policies for new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can read notifications sent to them
CREATE POLICY "Users can read their notifications" ON notifications
  FOR SELECT USING (
    id IN (
      SELECT notification_id FROM user_notifications 
      WHERE user_id = auth.uid()
    )
  );

-- Notifications: Admins can create notifications
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User notifications: Users can read their own notifications
CREATE POLICY "Users can read their user notifications" ON user_notifications
  FOR SELECT USING (user_id = auth.uid());

-- User notifications: Users can update their own notification read status
CREATE POLICY "Users can update their notification read status" ON user_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Notification templates: Everyone can read active templates
CREATE POLICY "Everyone can read active notification templates" ON notification_templates
  FOR SELECT USING (is_active = TRUE);

-- Scheduled notifications: Admins can manage scheduled notifications
CREATE POLICY "Admins can manage scheduled notifications" ON scheduled_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User push tokens: Users can manage their own push tokens
CREATE POLICY "Users can manage their own push tokens" ON user_push_tokens
  FOR ALL USING (user_id = auth.uid());

-- 14. Update existing chat_threads RLS policies to handle new columns
DROP POLICY IF EXISTS "Users can read threads they are members of" ON chat_threads;
CREATE POLICY "Users can read threads they are members of" ON chat_threads
  FOR SELECT USING (
    id IN (
      SELECT thread_id FROM chat_memberships 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- 15. Add comments for documentation
COMMENT ON TABLE notifications IS 'App-wide notifications sent to users';
COMMENT ON TABLE user_notifications IS 'Tracks which users received which notifications';
COMMENT ON TABLE notification_templates IS 'Templates for different types of notifications';
COMMENT ON TABLE scheduled_notifications IS 'Manages scheduled notifications for events';
COMMENT ON TABLE user_push_tokens IS 'Stores push notification tokens for users';
COMMENT ON COLUMN chat_threads.event_id IS 'Links chat thread to specific event';
COMMENT ON COLUMN chat_threads.thread_type IS 'Type of chat thread: group, dm, event, notification';
COMMENT ON COLUMN chat_threads.is_notification IS 'Whether this thread is for notifications only';
