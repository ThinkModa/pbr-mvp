// Chat service for mobile app
// Handles CRUD operations for chat threads, messages, and memberships
// Uses REST API to avoid Supabase client compatibility issues with Expo Go

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
  // Use the network IP address that Expo Go can reach
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // Get chat threads for a user (with filters for announcements, group chats, direct messages)
  static async getUserThreads(
    userId: string, 
    type?: 'announcements' | 'group' | 'direct'
  ): Promise<ChatThread[]> {
    console.log('Getting user threads:', { userId, type });
    
    let query = `${this.SUPABASE_URL}/rest/v1/chat_threads?select=*,chat_memberships!inner(user_id,unread_count,last_read_at)`;
    
    // Add type filter
    if (type === 'announcements') {
      query += '&type=eq.event&event_id=not.is.null';
    } else if (type === 'group') {
      query += '&type=in.(group,event)';
    } else if (type === 'direct') {
      query += '&type=eq.dm';
    }
    
    // Filter by user membership
    query += `&chat_memberships.user_id=eq.${userId}&chat_memberships.is_active=eq.true`;
    
    // Order by last message time
    query += '&order=last_message_at.desc.nullslast';

    const response = await fetch(query, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting user threads:', errorText);
      throw new Error(`Failed to get user threads: ${errorText}`);
    }

    const threads = await response.json();
    console.log('✅ Retrieved user threads:', threads.length);
    
    // Transform and enrich the data
    const enrichedThreads = await Promise.all(
      threads.map(async (thread: any) => {
        const enriched = await this.enrichThread(thread, userId);
        return enriched;
      })
    );

    return enrichedThreads;
  }

  // Get messages for a specific thread
  static async getThreadMessages(threadId: string, limit: number = 50): Promise<ChatMessage[]> {
    console.log('🔍 ChatService.getThreadMessages called:', { threadId, limit });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_messages?thread_id=eq.${threadId}&order=created_at.desc&limit=${limit}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting thread messages:', errorText);
      throw new Error(`Failed to get thread messages: ${errorText}`);
    }

    const messages = await response.json();
    console.log('🔍 ChatService: Retrieved thread messages:', messages.length);
    console.log('🔍 ChatService: Raw messages:', messages);
    
    // Transform and enrich the data
    const enrichedMessages = await Promise.all(
      messages.map(async (message: any) => {
        console.log('🔍 ChatService: About to enrich message:', message.id);
        const enriched = await this.enrichMessage(message);
        console.log('🔍 ChatService: Enriched message result:', enriched);
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

    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_messages`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending message:', errorText);
      throw new Error(`Failed to send message: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Message sending response text:', responseText);
    
    let message;
    if (responseText.trim() === '') {
      // Empty response is normal for successful POST operations in Supabase
      console.log('Empty response received, fetching sent message...');
      message = await this.fetchMostRecentMessage(threadId);
    } else {
      try {
        message = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response text was:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
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

    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_memberships`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(membershipData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error joining thread:', errorText);
      throw new Error(`Failed to join thread: ${errorText}`);
    }

    console.log('✅ Joined thread:', threadId);
  }

  // Leave a thread
  static async leaveThread(threadId: string, userId: string): Promise<void> {
    console.log('Leaving thread:', { threadId, userId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_memberships?thread_id=eq.${threadId}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          is_active: false,
          left_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error leaving thread:', errorText);
      throw new Error(`Failed to leave thread: ${errorText}`);
    }

    console.log('✅ Left thread:', threadId);
  }

  // Mark messages as read
  static async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    console.log('Marking messages as read:', { threadId, userId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_memberships?thread_id=eq.${threadId}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          last_read_at: new Date().toISOString(),
          unread_count: 0,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error marking messages as read:', errorText);
      throw new Error(`Failed to mark messages as read: ${errorText}`);
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

    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_threads`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(threadData),
      }
    );

    console.log('Direct message thread creation response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct message thread creation failed:', errorText);
      throw new Error(`Failed to create direct message thread: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Direct message thread creation response text:', responseText);
    
    let thread;
    if (responseText.trim() === '') {
      // Empty response is normal for successful POST operations in Supabase
      console.log('Empty response received, fetching created thread...');
      thread = await this.fetchMostRecentThread(userId1);
    } else {
      try {
        thread = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response text was:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
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

    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_threads`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(threadData),
      }
    );

    console.log('Group chat thread creation response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Group chat thread creation failed:', errorText);
      throw new Error(`Failed to create group chat thread: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Group chat thread creation response text:', responseText);
    
    let thread;
    if (responseText.trim() === '') {
      // Empty response is normal for successful POST operations in Supabase
      // We need to fetch the created thread separately
      console.log('Empty response received, fetching created thread...');
      thread = await this.fetchMostRecentThread(creatorId);
    } else {
      try {
        thread = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response text was:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
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
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_threads?select=*&order=created_at.desc&limit=1`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch recent thread: ${response.status} ${errorText}`);
    }

    const threads = await response.json();
    if (threads.length === 0) {
      throw new Error('No recent thread found');
    }

    return threads[0];
  }

  // Helper method to fetch the most recently sent message in a thread
  private static async fetchMostRecentMessage(threadId: string): Promise<any> {
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_messages?select=*&thread_id=eq.${threadId}&order=created_at.desc&limit=1`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch recent message: ${response.status} ${errorText}`);
    }

    const messages = await response.json();
    if (messages.length === 0) {
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

    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_memberships`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(membershipData),
      }
    );

    console.log('Add user to thread response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Add user to thread failed:', errorText);
      throw new Error(`Failed to add user to thread: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Add user to thread response text:', responseText);
  }

  // Helper method to find existing direct message thread
  private static async findDirectMessageThread(userId1: string, userId2: string): Promise<ChatThread | null> {
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_threads?type=eq.dm&is_private=eq.true&select=*,chat_memberships!inner(user_id)`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return null;
    }

    const threads = await response.json();
    
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
    await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_threads?id=eq.${threadId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          last_message_at: new Date().toISOString(),
        }),
      }
    );
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
        const eventResponse = await fetch(
          `${this.SUPABASE_URL}/rest/v1/events?id=eq.${thread.event_id}&select=id,title,start_time,end_time`,
          { headers: this.getHeaders() }
        );
        if (eventResponse.ok) {
          const events = await eventResponse.json();
          if (events.length > 0) {
            enriched.event = events[0];
          }
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      }
    }

    // Add other user data for direct messages
    if (thread.type === 'dm') {
      try {
        const membersResponse = await fetch(
          `${this.SUPABASE_URL}/rest/v1/chat_memberships?thread_id=eq.${thread.id}&user_id=neq.${userId}&select=user_id,users!inner(id,name,email,profile_image_url)`,
          { headers: this.getHeaders() }
        );
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          if (members.length > 0) {
            enriched.otherUser = members[0].users;
          }
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

    // Add user data with improved name handling
    try {
      console.log('🔍 ChatService: Fetching user data for userId:', message.user_id);
      const userResponse = await fetch(
        `${this.SUPABASE_URL}/rest/v1/users?id=eq.${message.user_id}&select=id,name,first_name,last_name,email,avatar_url`,
        { headers: this.getHeaders() }
      );
      console.log('🔍 ChatService: User response status:', userResponse.status);
      if (userResponse.ok) {
        const users = await userResponse.json();
        console.log('🔍 ChatService: Users found:', users.length, users);
        if (users.length > 0) {
          const user = users[0];
          console.log('🔍 ChatService: Raw user data:', user);
          // Construct name from first_name and last_name if name is missing
          if (!user.name && (user.first_name || user.last_name)) {
            user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            console.log('🔍 ChatService: Constructed name from first/last:', user.name);
          }
          // Fallback to email if no name available
          if (!user.name && user.email) {
            user.name = user.email.split('@')[0]; // Use email prefix as fallback
            console.log('🔍 ChatService: Using email prefix as name:', user.name);
          }
          enriched.user = user;
          console.log('🔍 ChatService: Final enriched user:', enriched.user);
        } else {
          console.log('🔍 ChatService: No users found for userId:', message.user_id);
        }
      } else {
        console.log('🔍 ChatService: User fetch failed with status:', userResponse.status);
      }
    } catch (error) {
      console.error('🔍 ChatService: Error fetching user data:', error);
    }

    return enriched;
  }
}
