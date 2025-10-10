// Notification service for push notifications
// Handles chat message notifications when app is closed

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface ChatNotification {
  id: string;
  title: string;
  body: string;
  data?: {
    threadId: string;
    messageId: string;
    userId: string;
    type: 'message' | 'mention' | 'system';
  };
}

export class NotificationService {
  private static isInitialized = false;
  private static expoPushToken: string | null = null;

  // Initialize the notification service
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing notification service...');

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return;
      }

      // Get push token
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chat-messages', {
          name: 'Chat Messages',
          description: 'Notifications for new chat messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'b7bbb674-9236-46b7-b271-a12902508678',
      });

      this.expoPushToken = token.data;
      console.log('✅ Push token obtained:', this.expoPushToken);

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Get the current push token
  static getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Send a local notification (for testing or when push notifications fail)
  static async sendLocalNotification(notification: ChatNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Local notification sent:', notification.id);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Send a push notification via Expo Push API
  static async sendPushNotification(
    expoPushToken: string,
    notification: ChatNotification
  ): Promise<void> {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: 1,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.status}`);
      }

      console.log('✅ Push notification sent:', notification.id);
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Fallback to local notification
      await this.sendLocalNotification(notification);
    }
  }

  // Create a chat message notification
  static createChatNotification(
    threadId: string,
    messageId: string,
    senderName: string,
    messageContent: string,
    threadName?: string
  ): ChatNotification {
    const title = threadName ? `${senderName} in ${threadName}` : senderName;
    const body = messageContent.length > 100 
      ? `${messageContent.substring(0, 100)}...` 
      : messageContent;

    return {
      id: `chat-${messageId}`,
      title,
      body,
      data: {
        threadId,
        messageId,
        userId: '', // Will be set by the sender
        type: 'message',
      },
    };
  }

  // Handle notification response (when user taps notification)
  static addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Handle notification received (when app is in foreground)
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Clear all notifications
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Set badge count
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Get badge count
  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Cancel specific notification
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }
}
