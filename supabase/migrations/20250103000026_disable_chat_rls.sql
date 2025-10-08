-- Disable RLS for chat tables to avoid recursion issues during development
-- This allows the chat functionality to work without complex policy dependencies

-- Disable RLS on chat tables
ALTER TABLE chat_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Users can view threads they are members of" ON chat_threads;
DROP POLICY IF EXISTS "Users can create threads" ON chat_threads;
DROP POLICY IF EXISTS "Admins can update threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can view messages in their threads" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their threads" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view memberships in their threads" ON chat_memberships;
DROP POLICY IF EXISTS "Users can join threads" ON chat_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON chat_memberships;
DROP POLICY IF EXISTS "Users can leave threads" ON chat_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON chat_memberships;
DROP POLICY IF EXISTS "Users can view thread memberships" ON chat_memberships;
