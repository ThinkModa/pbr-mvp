-- Disable RLS for users table to allow anonymous updates
-- This is needed for the mobile app to update user profiles using the anon role

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
