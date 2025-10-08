-- Add RLS policies for chat tables
-- This ensures proper data access control for chat functionality

-- Enable RLS on chat tables
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships ENABLE ROW LEVEL SECURITY;

-- Chat Threads Policies
-- Users can view threads they are members of
CREATE POLICY "Users can view threads they are members of" ON chat_threads
    FOR SELECT USING (
        id IN (
            SELECT thread_id 
            FROM chat_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can create threads (will be handled by service role)
CREATE POLICY "Users can create threads" ON chat_threads
    FOR INSERT WITH CHECK (true);

-- Users can update threads they are admins of
CREATE POLICY "Admins can update threads" ON chat_threads
    FOR UPDATE USING (
        id IN (
            SELECT thread_id 
            FROM chat_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = true
        )
    );

-- Chat Messages Policies
-- Users can view messages in threads they are members of
CREATE POLICY "Users can view messages in their threads" ON chat_messages
    FOR SELECT USING (
        thread_id IN (
            SELECT thread_id 
            FROM chat_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can create messages in threads they are members of
CREATE POLICY "Users can create messages in their threads" ON chat_messages
    FOR INSERT WITH CHECK (
        thread_id IN (
            SELECT thread_id 
            FROM chat_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (user_id = auth.uid());

-- Chat Memberships Policies
-- Users can view memberships for threads they are members of
CREATE POLICY "Users can view memberships in their threads" ON chat_memberships
    FOR SELECT USING (
        thread_id IN (
            SELECT thread_id 
            FROM chat_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can create memberships (join threads)
CREATE POLICY "Users can join threads" ON chat_memberships
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own memberships
CREATE POLICY "Users can update their own memberships" ON chat_memberships
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own memberships (leave threads)
CREATE POLICY "Users can leave threads" ON chat_memberships
    FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_event_id ON chat_threads(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_type ON chat_threads(type);
CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at ON chat_threads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_memberships_user_id ON chat_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_memberships_thread_id ON chat_memberships(thread_id);
