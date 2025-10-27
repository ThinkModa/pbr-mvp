-- Add default event for non-event notifications
-- Migration: 20250103000079_add_default_event.sql

-- 1. Create a default event for system notifications
INSERT INTO events (id, title, description, slug, status, organization_id, start_time, end_time, timezone, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'System Notifications',
  'Default event for system-generated notifications like chat messages',
  'system-notifications',
  'published',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2025-01-01T00:00:00Z',
  '2030-12-31T23:59:59Z',
  'UTC',
  false
)
ON CONFLICT (id) DO NOTHING;

-- 2. Add comment for documentation
COMMENT ON TABLE events IS 'Events table - includes a default system event for non-event notifications';
