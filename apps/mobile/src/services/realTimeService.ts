import { supabase } from '../lib/supabase';
// import { NotificationService } from './notificationService'; // Temporarily disabled
// Real-time service for live chat updates
// Uses Supabase Realtime via REST API polling for Expo Go compatibility

export interface RealtimeMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image_url: string | null;
  };
}

export interface RealtimeThreadUpdate {
  id: string;
  lastMessageAt: string;
  unreadCount?: number;
}

export type MessageCallback = (message: RealtimeMessage) => void;
export type ThreadUpdateCallback = (update: RealtimeThreadUpdate) => void;

export class RealTimeService {
  
  private static pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static messageCallbacks: Map<string, MessageCallback[]> = new Map();
  private static threadUpdateCallbacks: Map<string, ThreadUpdateCallback[]> = new Map();
  private static lastMessageTimestamps: Map<string, string> = new Map();
  private static lastThreadUpdates: Map<string, string> = new Map();


  // Start listening for new messages in a thread
  static startListeningToThread(threadId: string, userId: string): void {
    console.log('Starting real-time listening for thread:', threadId);
    
    // Stop existing polling if any
    this.stopListeningToThread(threadId);
    
    // Start polling for new messages
    const interval = setInterval(async () => {
      try {
        await this.checkForNewMessages(threadId, userId);
        await this.checkForThreadUpdates(threadId, userId);
      } catch (error) {
        console.error('Error in real-time polling:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    this.pollingIntervals.set(threadId, interval);
  }

  // Stop listening for new messages in a thread
  static stopListeningToThread(threadId: string): void {
    console.log('Stopping real-time listening for thread:', threadId);
    
    const interval = this.pollingIntervals.get(threadId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(threadId);
    }
    
    // Clean up callbacks and timestamps
    this.messageCallbacks.delete(threadId);
    this.threadUpdateCallbacks.delete(threadId);
    this.lastMessageTimestamps.delete(threadId);
    this.lastThreadUpdates.delete(threadId);
  }

  // Subscribe to new messages in a thread
  static subscribeToMessages(threadId: string, callback: MessageCallback): () => void {
    if (!this.messageCallbacks.has(threadId)) {
      this.messageCallbacks.set(threadId, []);
    }
    
    this.messageCallbacks.get(threadId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.messageCallbacks.get(threadId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Subscribe to thread updates (unread count, last message time)
  static subscribeToThreadUpdates(threadId: string, callback: ThreadUpdateCallback): () => void {
    if (!this.threadUpdateCallbacks.has(threadId)) {
      this.threadUpdateCallbacks.set(threadId, []);
    }
    
    this.threadUpdateCallbacks.get(threadId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.threadUpdateCallbacks.get(threadId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Check for new messages in a thread
  private static async checkForNewMessages(threadId: string, userId: string): Promise<void> {
    const lastTimestamp = this.lastMessageTimestamps.get(threadId);
    
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (lastTimestamp) {
      query = query.gt('created_at', lastTimestamp);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error checking for new messages:', error);
      return;
    }
    
    if (messages.length > 0) {
      // Update last timestamp
      this.lastMessageTimestamps.set(threadId, messages[0].created_at);
      
      // Process new messages (reverse to get chronological order)
      const newMessages = messages.reverse();
      
      for (const message of newMessages) {
        // Skip messages from the current user (they already see them)
        if (message.user_id === userId) {
          continue;
        }
        
        // Enrich message with user data
        const enrichedMessage = await this.enrichMessage(message);
        
        // Send push notification for new message
        try {
          await this.sendChatNotification(enrichedMessage, threadId);
        } catch (error) {
          console.error('Error sending chat notification:', error);
        }
        
        // Notify callbacks
        const callbacks = this.messageCallbacks.get(threadId);
        if (callbacks) {
          callbacks.forEach(callback => callback(enrichedMessage));
        }
      }
    }
  }

  // Check for thread updates (unread count, last message time)
  private static async checkForThreadUpdates(threadId: string, userId: string): Promise<void> {
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('id, last_message_at')
      .eq('id', threadId);

    if (error) {
      console.error('Error checking for thread updates:', error);
      return;
    }
    
    if (threads.length > 0) {
      const thread = threads[0];
      const lastUpdate = this.lastThreadUpdates.get(threadId);
      
      // Check if thread has been updated
      if (!lastUpdate || thread.last_message_at !== lastUpdate) {
        this.lastThreadUpdates.set(threadId, thread.last_message_at || '');
        
        // Get unread count
        const { data: memberships, error: membershipError } = await supabase
          .from('chat_memberships')
          .select('unread_count')
          .eq('thread_id', threadId)
          .eq('user_id', userId);
        
        let unreadCount = 0;
        if (!membershipError && memberships && memberships.length > 0) {
          unreadCount = memberships[0].unread_count || 0;
        }
        
        // Notify callbacks
        const callbacks = this.threadUpdateCallbacks.get(threadId);
        if (callbacks) {
          const update: RealtimeThreadUpdate = {
            id: threadId,
            lastMessageAt: thread.last_message_at || '',
            unreadCount,
          };
          
          callbacks.forEach(callback => callback(update));
        }
      }
    }
  }

  // Helper method to enrich message with user data
  private static async enrichMessage(message: any): Promise<RealtimeMessage> {
    const enriched: RealtimeMessage = {
      id: message.id,
      threadId: message.thread_id,
      userId: message.user_id,
      content: message.content,
      messageType: message.message_type,
      createdAt: message.created_at,
    };

    // Add user data with improved name handling
    try {
      console.log('🔍 RealTimeService: Fetching user data for userId:', message.user_id);
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, first_name, last_name, email, avatar_url')
        .eq('id', message.user_id);
      
      console.log('🔍 RealTimeService: Query result:', { users, error });
      if (!error && users && users.length > 0) {
        const user = users[0];
        console.log('🔍 RealTimeService: Raw user data:', user);
        // Construct name from first_name and last_name if name is missing
        if (!user.name && (user.first_name || user.last_name)) {
          user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
          console.log('🔍 RealTimeService: Constructed name from first/last:', user.name);
        }
        // Fallback to email if no name available
        if (!user.name && user.email) {
          user.name = user.email.split('@')[0]; // Use email prefix as fallback
          console.log('🔍 RealTimeService: Using email prefix as name:', user.name);
        }
        enriched.user = user;
        console.log('🔍 RealTimeService: Final enriched user:', enriched.user);
      } else {
        console.log('🔍 RealTimeService: No users found or error:', { users, error });
      }
    } catch (error) {
      console.error('🔍 RealTimeService: Error fetching user data for real-time message:', error);
    }

    return enriched;
  }

  // Send push notification for new chat message
  private static async sendChatNotification(message: RealtimeMessage, threadId: string): Promise<void> {
    try {
      // Get thread information to determine notification title
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .select('name, type')
        .eq('id', threadId)
        .single();

      if (threadError || !thread) {
        console.error('Error fetching thread for notification:', threadError);
        return;
      }

      // Determine notification title based on thread type
      let title: string;
      if (thread.type === 'dm') {
        title = message.user?.name || 'New Message';
      } else {
        title = thread.name || 'Group Chat';
      }

      // Create notification (temporarily disabled)
      // await NotificationService.createChatNotification({
      //   title,
      //   body: message.content,
      //   data: {
      //     threadId,
      //     messageId: message.id,
      //     type: 'chat_message'
      //   }
      // });
    } catch (error) {
      console.error('Error creating chat notification:', error);
    }
  }

  // Clean up all listeners (call when app goes to background)
  static cleanup(): void {
    console.log('Cleaning up real-time service');
    
    // Clear all polling intervals
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
    
    // Clear all callbacks
    this.messageCallbacks.clear();
    this.threadUpdateCallbacks.clear();
    
    // Clear all timestamps
    this.lastMessageTimestamps.clear();
    this.lastThreadUpdates.clear();
  }
}
