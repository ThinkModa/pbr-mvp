import { Alert } from 'react-native';

// Conditionally import expo-calendar to avoid issues in Expo Go
let Calendar: any = null;
try {
  Calendar = require('expo-calendar');
} catch (error) {
  console.log('expo-calendar not available in Expo Go, calendar features disabled');
}

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  url?: string;
}

export class CalendarService {
  // Request calendar permissions
  static async requestPermissions(): Promise<boolean> {
    if (!Calendar) {
      console.log('Calendar not available in Expo Go');
      return false;
    }
    
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  // Get default calendar
  static async getDefaultCalendar(): Promise<Calendar.Calendar | null> {
    if (!Calendar) {
      console.log('Calendar not available in Expo Go');
      return null;
    }
    
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Try to find the default calendar
      const defaultCalendar = calendars.find(cal => cal.isPrimary);
      if (defaultCalendar) {
        return defaultCalendar;
      }

      // If no default found, use the first available calendar
      if (calendars.length > 0) {
        return calendars[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  // Add event to calendar
  static async addEventToCalendar(event: CalendarEvent): Promise<boolean> {
    if (!Calendar) {
      console.log('Calendar not available in Expo Go');
      Alert.alert(
        'Calendar Not Available',
        'Calendar integration is not available in Expo Go. This feature will work in a production build.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Calendar Permission Required',
          'Please allow calendar access to add events to your calendar.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Get default calendar
      const calendar = await this.getDefaultCalendar();
      if (!calendar) {
        Alert.alert(
          'No Calendar Available',
          'No calendar was found on your device.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Create the event
      const eventId = await Calendar.createEventAsync(calendar.id, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        url: event.url,
        timeZone: 'UTC', // Use UTC to match our database
      });

      console.log('✅ Event added to calendar:', eventId);
      return true;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      Alert.alert(
        'Error',
        'Failed to add event to calendar. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  // Check if event exists in calendar (by title and date)
  static async eventExistsInCalendar(event: CalendarEvent): Promise<boolean> {
    if (!Calendar) {
      console.log('Calendar not available in Expo Go');
      return false;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const calendar = await this.getDefaultCalendar();
      if (!calendar) return false;

      // Get events for the date range
      const startOfDay = new Date(event.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(event.endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await Calendar.getEventsAsync([calendar.id], startOfDay, endOfDay);
      
      // Check if any event matches our title and time
      return events.some(calEvent => 
        calEvent.title === event.title &&
        Math.abs(calEvent.startDate.getTime() - event.startDate.getTime()) < 60000 // Within 1 minute
      );
    } catch (error) {
      console.error('Error checking if event exists in calendar:', error);
      return false;
    }
  }

  // Remove event from calendar (by title and date)
  static async removeEventFromCalendar(event: CalendarEvent): Promise<boolean> {
    if (!Calendar) {
      console.log('Calendar not available in Expo Go');
      return false;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const calendar = await this.getDefaultCalendar();
      if (!calendar) return false;

      // Get events for the date range
      const startOfDay = new Date(event.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(event.endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await Calendar.getEventsAsync([calendar.id], startOfDay, endOfDay);
      
      // Find matching event
      const matchingEvent = events.find(calEvent => 
        calEvent.title === event.title &&
        Math.abs(calEvent.startDate.getTime() - event.startDate.getTime()) < 60000 // Within 1 minute
      );

      if (matchingEvent) {
        await Calendar.deleteEventAsync(matchingEvent.id);
        console.log('✅ Event removed from calendar:', matchingEvent.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error removing event from calendar:', error);
      return false;
    }
  }
}
