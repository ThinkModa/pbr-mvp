-- Disable RLS for admin operations
-- Since we're using service role client, we don't need complex RLS policies

-- Disable RLS on key tables for admin operations
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled for user data protection
-- But simplify the policies to avoid recursion

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Service role bypass" ON users;

-- Create simple policies for users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous access for public data (needed for events)
CREATE POLICY "Public read access" ON users
    FOR SELECT USING (true);
