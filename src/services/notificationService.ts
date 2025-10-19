import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TimezoneUtils } from '../utils/timezoneUtils';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  // Request notification permissions
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Setup notification categories
  setupNotificationCategories: async () => {
    try {
      // Skip notification categories on web as they're not supported
      if (Platform.OS === 'web') {
        console.log('Skipping notification categories setup on web');
        return;
      }

      // Sleep check-in category
      await Notifications.setNotificationCategoryAsync('sleep_checkin', [
        {
          identifier: 'check_in',
          buttonTitle: 'I\'m Still Awake',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'falling_asleep',
          buttonTitle: 'I\'m Falling Asleep',
          options: { opensAppToForeground: true },
        },
      ]);

      // Bedtime reminder category
      await Notifications.setNotificationCategoryAsync('bedtime_reminder', [
        {
          identifier: 'go_to_sleep',
          buttonTitle: 'Start Sleep Mode',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'snooze',
          buttonTitle: 'Remind in 15 min',
          options: { opensAppToForeground: false },
        },
      ]);

      // Alarm category
      await Notifications.setNotificationCategoryAsync('alarm', [
        {
          identifier: 'snooze',
          buttonTitle: 'Snooze',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: { opensAppToForeground: true },
        },
      ]);

      // Wake-up category
      await Notifications.setNotificationCategoryAsync('wake_up', [
        {
          identifier: 'view_summary',
          buttonTitle: 'View Summary',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'continue',
          buttonTitle: 'Continue',
          options: { opensAppToForeground: true },
        },
      ]);
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  },

  // Schedule bedtime reminder
  scheduleBedtimeReminder: async (bedtime: string) => {
    try {
      // Cancel existing bedtime reminders
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const [hours, minutes] = bedtime.split(':').map(Number);
      const reminderTime = TimezoneUtils.createLocalDateTime(bedtime);
      
      // If the time has already passed today, schedule for tomorrow
      if (reminderTime <= new Date()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for Bed! 🌙',
          body: 'Your sheep is getting sleepy. Time to start your sleep routine!',
          categoryIdentifier: 'bedtime_reminder',
          data: { type: 'bedtime_reminder' },
        },
        trigger: {
          date: reminderTime,
          repeats: true,
        },
      });

      console.log('Bedtime reminder scheduled for:', reminderTime);
      TimezoneUtils.logTimezoneInfo();
    } catch (error) {
      console.error('Error scheduling bedtime reminder:', error);
    }
  },

  // Schedule check-in notifications during sleep
  scheduleCheckInNotifications: async (intervalMinutes: number = 30) => {
    try {
      const now = new Date();
      
      // Schedule multiple check-ins throughout the night
      for (let i = 1; i <= 6; i++) {
        const checkInTime = new Date(now.getTime() + (intervalMinutes * i * 60 * 1000));
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Sleep Check-in 🌙',
            body: 'Are you still awake? Let your sheep know!',
            categoryIdentifier: 'sleep_checkin',
            data: { type: 'sleep_checkin', checkInNumber: i },
          },
          trigger: {
            date: checkInTime,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling check-in notifications:', error);
    }
  },

  // Schedule wake-up alarm
  scheduleWakeUpAlarm: async (wakeTime: string) => {
    try {
      const [hours, minutes] = wakeTime.split(':').map(Number);
      const now = new Date();
      const alarmTime = new Date();
      alarmTime.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good Morning! ☀️',
          body: 'Time to wake up! Your sheep is excited to see you!',
          sound: 'default',
          data: { type: 'wake_up_alarm' },
        },
        trigger: {
          date: alarmTime,
          repeats: true,
        },
      });

      console.log('Wake-up alarm scheduled for:', alarmTime);
    } catch (error) {
      console.error('Error scheduling wake-up alarm:', error);
    }
  },

  // Cancel all notifications
  cancelAllNotifications: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  },

  // Send immediate notification
  sendNotification: async (title: string, body: string, data?: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  },
};