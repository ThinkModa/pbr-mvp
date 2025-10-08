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
  private static readonly SUPABASE_URL = 'http://192.168.1.129:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  private static pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static messageCallbacks: Map<string, MessageCallback[]> = new Map();
  private static threadUpdateCallbacks: Map<string, ThreadUpdateCallback[]> = new Map();
  private static lastMessageTimestamps: Map<string, string> = new Map();
  private static lastThreadUpdates: Map<string, string> = new Map();

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

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
    let query = `${this.SUPABASE_URL}/rest/v1/chat_messages?thread_id=eq.${threadId}&order=created_at.desc&limit=10`;
    
    if (lastTimestamp) {
      query += `&created_at=gt.${lastTimestamp}`;
    }

    const response = await fetch(query, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return;
    }

    const messages = await response.json();
    
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
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/chat_threads?id=eq.${threadId}&select=id,last_message_at`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return;
    }

    const threads = await response.json();
    
    if (threads.length > 0) {
      const thread = threads[0];
      const lastUpdate = this.lastThreadUpdates.get(threadId);
      
      // Check if thread has been updated
      if (!lastUpdate || thread.last_message_at !== lastUpdate) {
        this.lastThreadUpdates.set(threadId, thread.last_message_at || '');
        
        // Get unread count
        const membershipResponse = await fetch(
          `${this.SUPABASE_URL}/rest/v1/chat_memberships?thread_id=eq.${threadId}&user_id=eq.${userId}&select=unread_count`,
          {
            headers: this.getHeaders(),
          }
        );
        
        let unreadCount = 0;
        if (membershipResponse.ok) {
          const memberships = await membershipResponse.json();
          if (memberships.length > 0) {
            unreadCount = memberships[0].unread_count || 0;
          }
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

    // Add user data
    try {
      const userResponse = await fetch(
        `${this.SUPABASE_URL}/rest/v1/users?id=eq.${message.user_id}&select=id,name,email,profile_image_url`,
        { headers: this.getHeaders() }
      );
      if (userResponse.ok) {
        const users = await userResponse.json();
        if (users.length > 0) {
          enriched.user = users[0];
        }
      }
    } catch (error) {
      console.error('Error fetching user data for real-time message:', error);
    }

    return enriched;
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
