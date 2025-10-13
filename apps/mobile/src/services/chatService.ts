// Chat service for mobile app
// Handles CRUD operations for chat threads, messages, and memberships
// Uses centralized Supabase client for consistent database configuration

import { supabase } from '../lib/supabase';

export interface ChatThread {
  id: string;
  name: string | null;
  description: string | null;
  type: 'group' | 'dm' | 'event' | 'organization';
  isPrivate: boolean;
  organizationId: string | null;
  eventId: string | null;
  allowMemberInvites: boolean;
  allowFileUploads: boolean;
  maxMembers: number | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  // Computed fields
  unreadCount?: number;
  lastMessage?: ChatMessage;
  event?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  };
  otherUser?: {
    id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_image_url: string | null;
  };
}

export interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  replyToId: string | null;
  eventId: string | null;
  attachments: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }>;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  reactions: Record<string, string[]>; // emoji -> user IDs
  createdAt: string;
  updatedAt: string;
  // Computed fields
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image_url: string | null;
  };
  replyTo?: ChatMessage;
  isDelivered?: boolean;
}

export interface ChatMembership {
  id: string;
  threadId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  notificationsEnabled: boolean;
  muteUntil: string | null;
  lastReadAt: string | null;
  unreadCount: number;
  isActive: boolean;
  joinedAt: string;
  leftAt: string | null;
  // Computed fields
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image_url: string | null;
  };
}

export class ChatService {

  // Get chat threads for a user (with filters for announcements, group chats, direct messages)
  static async getUserThreads(
    userId: string, 
    type?: 'announcements' | 'group' | 'direct'
  ): Promise<ChatThread[]> {
    console.log('Getting user threads:', { userId, type });
    
    let supabaseQuery = supabase
      .from('chat_threads')
      .select(`
        *,
        chat_memberships!inner(user_id,unread_count,last_read_at)
      `)
      .eq('chat_memberships.user_id', userId)
      .eq('chat_memberships.is_active', true)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    
    // Add type filter
    if (type === 'announcements') {
      supabaseQuery = supabaseQuery.eq('type', 'event').not('event_id', 'is', null);
    } else if (type === 'group') {
      supabaseQuery = supabaseQuery.in('type', ['group', 'event']);
    } else if (type === 'direct') {
      supabaseQuery = supabaseQuery.eq('type', 'dm');
    }

    const { data: threads, error } = await supabaseQuery;

    if (error) {
      console.error('Error fetching user threads:', error);
      throw new Error(`Failed to get user threads: ${error.message}`);
    }

    console.log('✅ Retrieved user threads:', threads?.length || 0);
    
    // Transform and enrich the data
    const enrichedThreads = await Promise.all(
      (threads || []).map(async (thread: any) => {
        const enriched = await this.enrichThread(thread, userId);
        return enriched;
      })
    );

    return enrichedThreads;
  }

  // Get messages for a specific thread
  static async getThreadMessages(threadId: string, limit: number = 50): Promise<ChatMessage[]> {
    console.log('Getting thread messages:', { threadId, limit });
    
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting thread messages:', error);
      throw new Error(`Failed to get thread messages: ${error.message}`);
    }
    console.log('✅ Retrieved thread messages:', messages.length);
    
    // Transform and enrich the data
    const enrichedMessages = await Promise.all(
      messages.map(async (message: any) => {
        const enriched = await this.enrichMessage(message);
        return enriched;
      })
    );

    return enrichedMessages.reverse(); // Return in chronological order
  }

  // Send a message to a thread
  static async sendMessage(
    threadId: string,
    userId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'system' = 'text',
    attachments: any[] = []
  ): Promise<ChatMessage> {
    console.log('Sending message:', { threadId, userId, content, messageType });
    
    const messageData = {
      thread_id: threadId,
      user_id: userId,
      content,
      message_type: messageType,
      attachments,
    };

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
    
    console.log('✅ Message sent:', message.id);
    
    // Update thread's last_message_at
    await this.updateThreadLastMessage(threadId);
    
    // Enrich and return the message
    const enrichedMessage = await this.enrichMessage(message);
    return enrichedMessage;
  }

  // Join a thread
  static async joinThread(threadId: string, userId: string): Promise<void> {
    console.log('Joining thread:', { threadId, userId });
    
    const membershipData = {
      thread_id: threadId,
      user_id: userId,
      role: 'member',
      notifications_enabled: true,
      unread_count: 0,
      is_active: true,
    };

    const { error } = await supabase
      .from('chat_memberships')
      .insert(membershipData);

    if (error) {
      console.error('Error joining thread:', error);
      throw new Error(`Failed to join thread: ${error.message}`);
    }

    console.log('✅ Joined thread:', threadId);
  }

  // Leave a thread
  static async leaveThread(threadId: string, userId: string): Promise<void> {
    console.log('Leaving thread:', { threadId, userId });
    
    const { error } = await supabase
      .from('chat_memberships')
      .update({
        is_active: false,
        left_at: new Date().toISOString(),
      })
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving thread:', error);
      throw new Error(`Failed to leave thread: ${error.message}`);
    }

    console.log('✅ Left thread:', threadId);
  }

  // Mark messages as read
  static async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    console.log('Marking messages as read:', { threadId, userId });
    
    const { error } = await supabase
      .from('chat_memberships')
      .update({
        last_read_at: new Date().toISOString(),
        unread_count: 0,
      })
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking messages as read:', error);
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }

    console.log('✅ Messages marked as read');
  }

  // Create a direct message thread between two users
  static async createDirectMessageThread(userId1: string, userId2: string): Promise<ChatThread> {
    console.log('Creating direct message thread:', { userId1, userId2 });
    
    // Check if thread already exists
    const existingThread = await this.findDirectMessageThread(userId1, userId2);
    if (existingThread) {
      return existingThread;
    }

    // Create new thread
    const threadData = {
      type: 'dm',
      is_private: true,
      allow_member_invites: false,
      allow_file_uploads: true,
    };

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .insert(threadData)
      .select()
      .single();

    if (error) {
      console.error('Direct message thread creation failed:', error);
      throw new Error(`Failed to create direct message thread: ${error.message}`);
    }
    console.log('✅ Created direct message thread:', thread.id);
    
    // Add both users to the thread
    await Promise.all([
      this.joinThread(thread.id, userId1),
      this.joinThread(thread.id, userId2),
    ]);

    // Enrich and return the thread
    const enrichedThread = await this.enrichThread(thread, userId1);
    return enrichedThread;
  }

  // Create a new group chat thread
  static async createGroupChatThread(creatorId: string, userIds: string[], threadName?: string): Promise<ChatThread> {
    console.log('Creating group chat thread:', { creatorId, userIds, threadName });
    console.log('Using Supabase URL:', this.SUPABASE_URL);
    console.log('Using API Key:', this.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    
    // Create new thread
    const threadData = {
      type: 'group',
      name: threadName || `Group Chat`,
      is_private: false,
      allow_member_invites: true,
      allow_file_uploads: true,
    };
    
    console.log('Sending thread data:', threadData);

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .insert(threadData)
      .select()
      .single();

    if (error) {
      console.error('Group chat thread creation failed:', error);
      throw new Error(`Failed to create group chat thread: ${error.message}`);
    }
    console.log('Created group chat thread:', thread);

    // Add all users to the thread
    const allUserIds = [creatorId, ...userIds];
    for (const userId of allUserIds) {
      await this.addUserToThread(thread.id, userId, userId === creatorId ? 'admin' : 'member');
    }

    // Enrich and return the thread
    const enrichedThread = await this.enrichThread(thread, creatorId);
    return enrichedThread;
  }

  // Helper method to fetch the most recently created thread for a user
  private static async fetchMostRecentThread(userId: string): Promise<any> {
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch recent thread: ${error.message}`);
    }

    if (!threads || threads.length === 0) {
      throw new Error('No recent thread found');
    }

    return threads[0];
  }

  // Helper method to fetch the most recently sent message in a thread
  private static async fetchMostRecentMessage(threadId: string): Promise<any> {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch recent message: ${error.message}`);
    }

    if (!messages || messages.length === 0) {
      throw new Error('No recent message found');
    }

    return messages[0];
  }

  // Helper method to add user to thread
  private static async addUserToThread(threadId: string, userId: string, role: string = 'member'): Promise<void> {
    const membershipData = {
      thread_id: threadId,
      user_id: userId,
      role: role,
      notifications_enabled: true,
      is_active: true,
      unread_count: 0,
    };

    const { error } = await supabase
      .from('chat_memberships')
      .insert(membershipData);

    if (error) {
      console.error('Add user to thread failed:', error);
      throw new Error(`Failed to add user to thread: ${error.message}`);
    }
  }

  // Helper method to find existing direct message thread
  private static async findDirectMessageThread(userId1: string, userId2: string): Promise<ChatThread | null> {
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*, chat_memberships!inner(user_id)')
      .eq('type', 'dm')
      .eq('is_private', true);

    if (error) {
      console.error('Error finding direct message thread:', error);
      return null;
    }
    
    // Find thread with exactly these two users
    for (const thread of threads) {
      const memberIds = thread.chat_memberships.map((m: any) => m.user_id);
      if (memberIds.includes(userId1) && memberIds.includes(userId2) && memberIds.length === 2) {
        return await this.enrichThread(thread, userId1);
      }
    }

    return null;
  }

  // Helper method to update thread's last_message_at
  private static async updateThreadLastMessage(threadId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_threads')
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    if (error) {
      console.error('Error updating thread last message:', error);
    }
  }

  // Helper method to enrich thread with additional data
  private static async enrichThread(thread: any, userId: string): Promise<ChatThread> {
    const enriched: ChatThread = {
      id: thread.id,
      name: thread.name,
      description: thread.description,
      type: thread.type,
      isPrivate: thread.is_private,
      organizationId: thread.organization_id,
      eventId: thread.event_id,
      allowMemberInvites: thread.allow_member_invites,
      allowFileUploads: thread.allow_file_uploads,
      maxMembers: thread.max_members,
      metadata: thread.metadata || {},
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessageAt: thread.last_message_at,
    };

    // Add unread count from membership
    if (thread.chat_memberships && thread.chat_memberships.length > 0) {
      const membership = thread.chat_memberships.find((m: any) => m.user_id === userId);
      if (membership) {
        enriched.unreadCount = membership.unread_count || 0;
      }
    }

    // Add event data if it's an event thread
    if (thread.event_id) {
      try {
        const { data: events, error } = await supabase
          .from('events')
          .select('id,title,start_time,end_time')
          .eq('id', thread.event_id);
        
        if (!error && events && events.length > 0) {
          enriched.event = events[0];
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      }
    }

    // Add other user data for direct messages
    if (thread.type === 'dm') {
      try {
        const { data: members, error } = await supabase
          .from('chat_memberships')
          .select('user_id, users!inner(id,name,first_name,last_name,email,profile_image_url)')
          .eq('thread_id', thread.id)
          .neq('user_id', userId);
        
        if (!error && members && members.length > 0) {
          enriched.otherUser = members[0].users;
        }
      } catch (error) {
        console.error('Error fetching other user data:', error);
      }
    }

    return enriched;
  }

  // Helper method to enrich message with additional data
  private static async enrichMessage(message: any): Promise<ChatMessage> {
    const enriched: ChatMessage = {
      id: message.id,
      threadId: message.thread_id,
      userId: message.user_id,
      content: message.content,
      messageType: message.message_type,
      replyToId: message.reply_to_id,
      eventId: message.event_id,
      attachments: message.attachments || [],
      isEdited: message.is_edited,
      editedAt: message.edited_at,
      isDeleted: message.is_deleted,
      deletedAt: message.deleted_at,
      reactions: message.reactions || {},
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      isDelivered: true, // Assume delivered for now
    };

    // Add user data
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id,name,email,profile_image_url')
        .eq('id', message.user_id);
      
      if (!error && users && users.length > 0) {
        enriched.user = users[0];
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    return enriched;
  }
}
