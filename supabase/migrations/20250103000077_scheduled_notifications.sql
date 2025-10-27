-- Implement scheduled notifications for event reminders
-- Migration: 20250103000069_scheduled_notifications.sql

-- 1. Create function to process scheduled notifications
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS void AS $$
DECLARE
  scheduled_record RECORD;
  event_record RECORD;
  template_record RECORD;
  notification_id UUID;
  event_start_time TIMESTAMPTZ;
  hours_until_event INTEGER;
  title_text TEXT;
  content_text TEXT;
BEGIN
  -- Process all pending scheduled notifications that are due
  FOR scheduled_record IN 
    SELECT sn.*, e.title as event_title, e.start_time, e.timezone
    FROM scheduled_notifications sn
    JOIN events e ON sn.event_id = e.id
    WHERE sn.status = 'pending' 
    AND sn.scheduled_for <= NOW()
    AND e.status = 'published'
  LOOP
    -- Get the notification template
    SELECT * INTO template_record
    FROM notification_templates
    WHERE id = scheduled_record.template_id
    AND is_active = true;
    
    -- Skip if template not found
    IF template_record IS NULL THEN
      UPDATE scheduled_notifications 
      SET status = 'failed', 
          error_message = 'Template not found or inactive',
          updated_at = NOW()
      WHERE id = scheduled_record.id;
      CONTINUE;
    END IF;
    
    -- Calculate time until event
    event_start_time := scheduled_record.start_time AT TIME ZONE COALESCE(scheduled_record.timezone, 'UTC');
    hours_until_event := EXTRACT(EPOCH FROM (event_start_time - NOW())) / 3600;
    
    -- Build title and content with template variables
    title_text := template_record.title_template;
    content_text := template_record.content_template;
    
    -- Replace template variables
    title_text := replace(title_text, '{{event_title}}', scheduled_record.event_title);
    content_text := replace(content_text, '{{event_title}}', scheduled_record.event_title);
    content_text := replace(content_text, '{{event_time}}', to_char(event_start_time, 'HH24:MI'));
    content_text := replace(content_text, '{{event_date}}', to_char(event_start_time, 'Mon DD, YYYY'));
    
    -- Create the notification
    INSERT INTO notifications (event_id, title, content, created_by, type)
    VALUES (
      scheduled_record.event_id,
      title_text,
      content_text,
      '00000000-0000-0000-0000-000000000000'::uuid, -- System user
      CASE template_record.trigger_type
        WHEN 'event_reminder_24h' THEN 'event_reminder'
        WHEN 'event_reminder_48h' THEN 'event_reminder'
        WHEN 'event_starting_1h' THEN 'event_starting'
        WHEN 'rsvp_reminder' THEN 'rsvp_reminder'
        ELSE 'event_reminder'
      END
    )
    RETURNING id INTO notification_id;
    
    -- Assign notification to all RSVP'd users
    INSERT INTO user_notifications (notification_id, user_id)
    SELECT notification_id, er.user_id
    FROM event_rsvps er
    WHERE er.event_id = scheduled_record.event_id 
    AND er.status = 'attending'
    ON CONFLICT (notification_id, user_id) DO NOTHING;
    
    -- Mark scheduled notification as sent
    UPDATE scheduled_notifications 
    SET status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = scheduled_record.id;
    
    RAISE LOG 'Processed scheduled notification % for event %', scheduled_record.id, scheduled_record.event_title;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Create function to schedule event reminders when an event is created/updated
CREATE OR REPLACE FUNCTION schedule_event_reminders()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  event_start_time TIMESTAMPTZ;
  reminder_times TIMESTAMPTZ[] := '{}';
  reminder_time TIMESTAMPTZ;
BEGIN
  -- Only process published events
  IF NEW.status != 'published' THEN
    RETURN NEW;
  END IF;
  
  -- Calculate event start time
  event_start_time := NEW.start_time AT TIME ZONE COALESCE(NEW.timezone, 'UTC');
  
  -- Get all active reminder templates
  FOR template_record IN 
    SELECT * FROM notification_templates 
    WHERE is_active = true 
    AND trigger_type IN ('event_reminder_24h', 'event_reminder_48h', 'event_starting_1h', 'rsvp_reminder')
  LOOP
    -- Calculate reminder time
    reminder_time := event_start_time + (template_record.trigger_offset_hours || ' hours')::interval;
    
    -- Only schedule if reminder time is in the future
    IF reminder_time > NOW() THEN
      -- Insert scheduled notification
      INSERT INTO scheduled_notifications (event_id, template_id, scheduled_for)
      VALUES (NEW.id, template_record.id, reminder_time)
      ON CONFLICT (event_id, template_id) DO UPDATE SET
        scheduled_for = reminder_time,
        status = 'pending',
        updated_at = NOW();
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to schedule reminders when events are published
DROP TRIGGER IF EXISTS schedule_event_reminders_trigger ON events;
CREATE TRIGGER schedule_event_reminders_trigger
  AFTER INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION schedule_event_reminders();

-- 4. Create a system user for scheduled notifications
INSERT INTO users (id, email, name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@pbr.com', 'System', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Add comments for documentation
COMMENT ON FUNCTION process_scheduled_notifications() IS 'Processes all due scheduled notifications and sends them';
COMMENT ON FUNCTION schedule_event_reminders() IS 'Schedules reminder notifications when events are published';
COMMENT ON TRIGGER schedule_event_reminders_trigger ON events IS 'Triggers reminder scheduling when events are published';
