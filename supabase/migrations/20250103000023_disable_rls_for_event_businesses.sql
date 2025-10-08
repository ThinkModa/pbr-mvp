-- Disable RLS for event_businesses table for testing purposes
-- This allows the web admin to assign/unassign organizations to events without authentication issues

ALTER TABLE event_businesses DISABLE ROW LEVEL SECURITY;
