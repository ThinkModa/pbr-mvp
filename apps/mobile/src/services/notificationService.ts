import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: {
    threadId?: string;
    messageId?: string;
    eventId?: string;
    notificationId?: string;
    type: 'chat_message' | 'event_created' | 'event_reminder' | 'event_starting' | 'rsvp_reminder' | 'event_cancelled' | 'event_updated' | 'new_chat_thread';
  };
}

export interface ChatNotificationData extends NotificationData {
  data: {
    threadId: string;
    messageId: string;
    type: 'chat_message';
  };
}

export interface EventNotificationData extends NotificationData {
  data: {
    eventId: string;
    notificationId?: string;
    type: 'event_created' | 'event_reminder' | 'event_starting' | 'rsvp_reminder' | 'event_cancelled' | 'event_updated';
  };
}

export interface ChatThreadNotificationData extends NotificationData {
  data: {
    threadId: string;
    type: 'new_chat_thread';
  };
}

export class NotificationService {
  private static expoPushToken: string | null = null;

  /**
   * Initialize the notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions not granted');
        return;
      }

      // Get the push token
      this.expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Expo push token:', this.expoPushToken);

      // Register for push notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Store the push token in the database
      await this.storePushToken();

    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  }

  /**
   * Store the push token in the database
   */
  private static async storePushToken(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          push_token: this.expoPushToken,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        // Check if it's a duplicate key error (expected behavior)
        if (error.code === '23505') {
          console.log('📱 Push token already exists (expected):', this.expoPushToken);
        } else {
          console.error('❌ Error storing push token:', error);
        }
      } else {
        console.log('✅ Push token stored successfully');
      }
    } catch (error) {
      console.error('❌ Error storing push token:', error);
    }
  }

  /**
   * Create a chat message notification
   */
  static async createChatNotification(notification: ChatNotificationData): Promise<void> {
    try {
      // Only send server-side push notifications (works when app is closed/backgrounded)
      // Removed local notification as it only works when app is open
      await this.sendPushNotificationToThread(notification);

    } catch (error) {
      console.error('❌ Error creating chat notification:', error);
    }
  }

  /**
   * Create an event notification
   */
  static async createEventNotification(notification: EventNotificationData): Promise<void> {
    try {
      // Only send server-side push notifications (works when app is closed/backgrounded)
      // Removed local notification as it only works when app is open
      await this.sendPushNotificationToEventAttendees(notification);

    } catch (error) {
      console.error('❌ Error creating event notification:', error);
    }
  }

  /**
   * Create a new chat thread notification
   */
  static async createChatThreadNotification(notification: ChatThreadNotificationData): Promise<void> {
    try {
      // Send local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      // Send push notification to thread members
      await this.sendPushNotificationToThreadMembers(notification);

    } catch (error) {
      console.error('❌ Error creating chat thread notification:', error);
    }
  }

  /**
   * Schedule a notification for a specific time
   */
  static async scheduleNotification(
    notification: NotificationData,
    triggerDate: Date
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log('✅ Notification scheduled for:', triggerDate);
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  private static async getUserNotificationPreferences(userId: string): Promise<{ push_enabled: boolean; events_enabled: boolean; chat_enabled: boolean } | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('❌ Error fetching user notification preferences:', error);
        return null;
      }

      return user.notification_preferences || {
        push_enabled: true,
        events_enabled: true,
        chat_enabled: true,
      };
    } catch (error) {
      console.error('❌ Error getting user notification preferences:', error);
      return null;
    }
  }

  /**
   * Send push notification to thread members
   */
  private static async sendPushNotificationToThread(notification: ChatNotificationData): Promise<void> {
    try {
      // Get thread members
      const { data: members, error } = await supabase
        .from('chat_memberships')
        .select(`
          user_id,
          users!inner(
            id,
            user_push_tokens(push_token, platform)
          )
        `)
        .eq('thread_id', notification.data.threadId)
        .eq('is_active', true);

      if (error || !members) {
        console.error('❌ Error fetching thread members:', error);
        return;
      }

      // Get current user to exclude from notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Send push notifications to all members except current user
      const pushTokens = [];
      for (const member of members) {
        if (member.user_id !== user.id) {
          // Check user's notification preferences
          const preferences = await this.getUserNotificationPreferences(member.user_id);
          if (preferences?.push_enabled && preferences?.chat_enabled) {
            const tokens = member.users?.user_push_tokens?.map(token => token.push_token) || [];
            pushTokens.push(...tokens.filter(token => token));
          }
        }
      }

      if (pushTokens.length > 0) {
        await this.sendExpoPushNotifications(pushTokens, notification);
      }

    } catch (error) {
      console.error('❌ Error sending push notification to thread:', error);
    }
  }

  /**
   * Send push notification to event attendees
   */
  private static async sendPushNotificationToEventAttendees(notification: EventNotificationData): Promise<void> {
    try {
      // Get event attendees
      const { data: attendees, error } = await supabase
        .from('rsvps')
        .select(`
          user_id,
          users!inner(
            id,
            user_push_tokens(push_token, platform)
          )
        `)
        .eq('event_id', notification.data.eventId)
        .eq('status', 'attending');

      if (error || !attendees) {
        console.error('❌ Error fetching event attendees:', error);
        return;
      }

      // Get current user to exclude from notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Send push notifications to all attendees except current user
      const pushTokens = attendees
        .filter(attendee => attendee.user_id !== user.id)
        .flatMap(attendee => 
          attendee.users?.user_push_tokens?.map(token => token.push_token) || []
        )
        .filter(token => token);

      if (pushTokens.length > 0) {
        await this.sendExpoPushNotifications(pushTokens, notification);
      }

    } catch (error) {
      console.error('❌ Error sending push notification to event attendees:', error);
    }
  }

  /**
   * Send push notification to thread members
   */
  private static async sendPushNotificationToThreadMembers(notification: ChatThreadNotificationData): Promise<void> {
    try {
      // Get thread members
      const { data: members, error } = await supabase
        .from('chat_memberships')
        .select(`
          user_id,
          users!inner(
            id,
            user_push_tokens(push_token, platform)
          )
        `)
        .eq('thread_id', notification.data.threadId)
        .eq('is_active', true);

      if (error || !members) {
        console.error('❌ Error fetching thread members:', error);
        return;
      }

      // Get current user to exclude from notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Send push notifications to all members except current user
      const pushTokens = members
        .filter(member => member.user_id !== user.id)
        .flatMap(member => 
          member.users?.user_push_tokens?.map(token => token.push_token) || []
        )
        .filter(token => token);

      if (pushTokens.length > 0) {
        await this.sendExpoPushNotifications(pushTokens, notification);
      }

    } catch (error) {
      console.error('❌ Error sending push notification to thread members:', error);
    }
  }

  /**
   * Send Expo push notifications
   */
  private static async sendExpoPushNotifications(
    pushTokens: string[],
    notification: NotificationData
  ): Promise<void> {
    try {
      const messages = pushTokens.map(token => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('✅ Push notifications sent:', result);

    } catch (error) {
      console.error('❌ Error sending Expo push notifications:', error);
    }
  }

  /**
   * Schedule event reminder notifications
   */
  static async scheduleEventReminders(eventId: string): Promise<void> {
    try {
      // Get event details
      const { data: event, error } = await supabase
        .from('events')
        .select('id, title, start_time')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        console.error('❌ Error fetching event for reminders:', error);
        return;
      }

      const eventDate = new Date(event.start_time);
      const now = new Date();

      // Schedule 24-hour reminder
      const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > now) {
        await this.scheduleNotification({
          title: `Event Tomorrow: ${event.title}`,
          body: `Don't forget! "${event.title}" is happening tomorrow.`,
          data: {
            eventId: event.id,
            type: 'event_reminder',
          },
        }, reminder24h);
      }

      // Schedule 1-hour reminder
      const reminder1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (reminder1h > now) {
        await this.scheduleNotification({
          title: `Event Starting Soon: ${event.title}`,
          body: `"${event.title}" starts in 1 hour! See you there!`,
          data: {
            eventId: event.id,
            type: 'event_starting',
          },
        }, reminder1h);
      }

      console.log('✅ Event reminders scheduled for:', event.title);

    } catch (error) {
      console.error('❌ Error scheduling event reminders:', error);
    }
  }

  /**
   * Cancel all scheduled notifications for an event
   */
  static async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Cancel notifications for this event
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.eventId === eventId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      console.log('✅ Cancelled notifications for event:', eventId);

    } catch (error) {
      console.error('❌ Error cancelling event notifications:', error);
    }
  }

  /**
   * Get the current push token
   */
  static getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Handle notification received while app is in foreground
   */
  static handleNotificationReceived(notification: Notifications.Notification): void {
    console.log('📱 Notification received:', notification);
    
    // Handle different notification types
    const data = notification.request.content.data;
    if (data?.type === 'chat_message') {
      // Navigate to chat thread
      console.log('💬 Chat message notification received');
    } else if (data?.type === 'event_created') {
      // Navigate to events
      console.log('📅 Event created notification received');
    } else if (data?.type === 'event_reminder') {
      // Navigate to event details
      console.log('⏰ Event reminder notification received');
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  static handleNotificationResponse(response: Notifications.NotificationResponse): void {
    console.log('👆 Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    if (data?.type === 'chat_message' && data.threadId) {
      // Navigate to chat thread
      console.log('💬 Navigating to chat thread:', data.threadId);
    } else if (data?.type === 'event_created' && data.eventId) {
      // Navigate to event details
      console.log('📅 Navigating to event:', data.eventId);
    } else if (data?.type === 'event_reminder' && data.eventId) {
      // Navigate to event details
      console.log('⏰ Navigating to event reminder:', data.eventId);
    }
  }
}
