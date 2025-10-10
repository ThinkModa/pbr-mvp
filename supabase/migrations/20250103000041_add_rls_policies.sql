-- Add Row Level Security policies for authentication
-- This migration enables RLS and creates policies for role-based access

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Allow unauthenticated access for signup (temporary)
DROP POLICY IF EXISTS "Allow unauthenticated signup" ON public.users;
CREATE POLICY "Allow unauthenticated signup" ON public.users
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own profile (except role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- Policy: Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update user roles
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published events
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (status = 'published' AND is_public = true);

-- Policy: Admins can manage all events
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on event_rsvps table
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own RSVPs
DROP POLICY IF EXISTS "Users can view own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can view own RSVPs" ON public.event_rsvps
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create/update their own RSVPs
DROP POLICY IF EXISTS "Users can manage own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can manage own RSVPs" ON public.event_rsvps
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all RSVPs
DROP POLICY IF EXISTS "Admins can view all RSVPs" ON public.event_rsvps;
CREATE POLICY "Admins can view all RSVPs" ON public.event_rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on activity_rsvps table
ALTER TABLE public.activity_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activity RSVPs
DROP POLICY IF EXISTS "Users can view own activity RSVPs" ON public.activity_rsvps;
CREATE POLICY "Users can view own activity RSVPs" ON public.activity_rsvps
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create/update their own activity RSVPs
DROP POLICY IF EXISTS "Users can manage own activity RSVPs" ON public.activity_rsvps;
CREATE POLICY "Users can manage own activity RSVPs" ON public.activity_rsvps
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all activity RSVPs
DROP POLICY IF EXISTS "Admins can view all activity RSVPs" ON public.activity_rsvps;
CREATE POLICY "Admins can view all activity RSVPs" ON public.activity_rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on chat_threads table
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view threads they're members of
DROP POLICY IF EXISTS "Users can view member threads" ON public.chat_threads;
CREATE POLICY "Users can view member threads" ON public.chat_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_memberships 
      WHERE thread_id = id AND user_id = auth.uid()
    )
  );

-- Policy: Users can create threads
DROP POLICY IF EXISTS "Users can create threads" ON public.chat_threads;
CREATE POLICY "Users can create threads" ON public.chat_threads
  FOR INSERT WITH CHECK (true);

-- Policy: Admins can view all threads
DROP POLICY IF EXISTS "Admins can view all threads" ON public.chat_threads;
CREATE POLICY "Admins can view all threads" ON public.chat_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in threads they're members of
DROP POLICY IF EXISTS "Users can view member messages" ON public.chat_messages;
CREATE POLICY "Users can view member messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_memberships 
      WHERE thread_id = chat_messages.thread_id AND user_id = auth.uid()
    )
  );

-- Policy: Users can send messages in threads they're members of
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_memberships 
      WHERE thread_id = chat_messages.thread_id AND user_id = auth.uid()
    )
  );

-- Policy: Users can update their own messages
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
CREATE POLICY "Users can update own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
CREATE POLICY "Admins can view all messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on chat_memberships table
ALTER TABLE public.chat_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view memberships for threads they're in
DROP POLICY IF EXISTS "Users can view thread memberships" ON public.chat_memberships;
CREATE POLICY "Users can view thread memberships" ON public.chat_memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_memberships cm2
      WHERE cm2.thread_id = chat_memberships.thread_id AND cm2.user_id = auth.uid()
    )
  );

-- Policy: Users can join threads
DROP POLICY IF EXISTS "Users can join threads" ON public.chat_memberships;
CREATE POLICY "Users can join threads" ON public.chat_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can leave threads
DROP POLICY IF EXISTS "Users can leave threads" ON public.chat_memberships;
CREATE POLICY "Users can leave threads" ON public.chat_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Policy: Admins can manage all memberships
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.chat_memberships;
CREATE POLICY "Admins can manage all memberships" ON public.chat_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );