-- Disable RLS for RSVP tables to allow testing with mock authentication
-- This is temporary for development/testing purposes

-- Disable RLS on RSVP tables
ALTER TABLE event_rsvps DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_rsvps DISABLE ROW LEVEL SECURITY;
