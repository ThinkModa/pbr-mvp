-- Fix RLS policies to allow database triggers to create notifications
-- Migration: 20250103000081_fix_notification_rls.sql

-- 1. Drop the existing restrictive policy
DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;

-- 2. Create a new policy that allows database functions to create notifications
-- This policy allows:
-- - Service role (for admin operations)
-- - Admin users (for admin operations)  
-- - Database functions/triggers (when auth.role() is null, which happens in triggers)
CREATE POLICY "Allow notification creation" ON notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    auth.role() IS NULL  -- This allows database triggers to work
  );

-- 3. Also fix user_notifications policy to allow triggers
DROP POLICY IF EXISTS "Service role can create user notifications" ON user_notifications;

CREATE POLICY "Allow user notification creation" ON user_notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    user_id = auth.uid() OR
    auth.role() IS NULL  -- This allows database triggers to work
  );

-- 4. Add comments for documentation
COMMENT ON POLICY "Allow notification creation" ON notifications IS 'Allows service role, admin users, and database triggers to create notifications';
COMMENT ON POLICY "Allow user notification creation" ON user_notifications IS 'Allows service role, users, and database triggers to create user notifications';
