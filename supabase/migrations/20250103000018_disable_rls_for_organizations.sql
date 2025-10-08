-- Disable RLS for organizations table for testing purposes
-- This allows the web admin to create, update, and delete organizations without authentication issues

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
