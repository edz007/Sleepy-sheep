/**
 * Bedtime reminder service for web and mobile platforms
 * Handles real-time bedtime checking and notifications
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { TimezoneUtils } from './timezoneUtils';

export class BedtimeReminderService {
  private static checkInterval: ReturnType<typeof setInterval> | null = null;
  private static currentBedtime: string | null = null;
  private static onBedtimeReached: (() => void) | null = null;

  /**
   * Start bedtime monitoring
   * @param bedtime Target bedtime in HH:MM format
   * @param onReached Callback when bedtime is reached
   */
  static startBedtimeMonitoring(bedtime: string, onReached?: () => void): void {
    console.log('Starting bedtime monitoring for:', bedtime);
    
    // Stop any existing monitoring
    this.stopBedtimeMonitoring();
    
    this.currentBedtime = bedtime;
    this.onBedtimeReached = onReached;

    if (Platform.OS === 'web') {
      // For web, use real-time checking
      this.startWebBedtimeCheck();
    } else {
      // For mobile, use notifications
      this.scheduleMobileNotification(bedtime);
    }
  }

  /**
   * Stop bedtime monitoring
   */
  static stopBedtimeMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (Platform.OS !== 'web') {
      Notifications.cancelAllScheduledNotificationsAsync();
    }
    
    this.currentBedtime = null;
    this.onBedtimeReached = null;
    console.log('Bedtime monitoring stopped');
  }

  /**
   * Web-specific bedtime checking
   */
  private static startWebBedtimeCheck(): void {
    console.log('Starting web bedtime check');
    
    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkBedtimeReached();
    }, 30000);

    // Also check immediately
    this.checkBedtimeReached();
  }

  /**
   * Check if bedtime has been reached
   */
  private static checkBedtimeReached(): void {
    if (!this.currentBedtime) return;

    const now = new Date();
    const targetTime = TimezoneUtils.createLocalDateTime(this.currentBedtime);
    
    // Check if current time is within 1 minute of target bedtime
    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    const oneMinute = 60 * 1000; // 1 minute in milliseconds
    
    console.log('Bedtime check:', {
      currentTime: now.toLocaleTimeString(),
      targetTime: targetTime.toLocaleTimeString(),
      timeDiff: Math.round(timeDiff / 1000) + ' seconds',
      isWithinMinute: timeDiff <= oneMinute
    });

    if (timeDiff <= oneMinute) {
      console.log('🎉 Bedtime reached!');
      this.triggerBedtimeReached();
    }
  }

  /**
   * Trigger bedtime reached callback
   */
  private static triggerBedtimeReached(): void {
    if (this.onBedtimeReached) {
      this.onBedtimeReached();
    }
    
    // Show visual notification for web
    if (Platform.OS === 'web') {
      this.showWebBedtimeNotification();
    }
    
    // Stop monitoring after triggering
    this.stopBedtimeMonitoring();
  }

  /**
   * Show bedtime notification for web
   */
  private static showWebBedtimeNotification(): void {
    // Simple alert for now to avoid DOM manipulation issues
    if (Platform.OS === 'web') {
      alert('🌙 Bedtime Reminder!\n\nIt\'s time to start your sleep routine! Your sheep is getting sleepy.');
    }
    
    console.log('Web bedtime notification shown');
  }

  /**
   * Schedule mobile notification
   */
  private static async scheduleMobileNotification(bedtime: string): Promise<void> {
    try {
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
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      
      console.log('Mobile bedtime notification scheduled for:', reminderTime);
    } catch (error) {
      console.error('Error scheduling mobile notification:', error);
    }
  }

  /**
   * Get current bedtime status
   */
  static getBedtimeStatus(): {
    isMonitoring: boolean;
    currentBedtime: string | null;
    timeUntilBedtime: number | null;
  } {
    if (!this.currentBedtime) {
      return {
        isMonitoring: false,
        currentBedtime: null,
        timeUntilBedtime: null,
      };
    }

    const now = new Date();
    const targetTime = TimezoneUtils.createLocalDateTime(this.currentBedtime);
    const timeUntilBedtime = targetTime.getTime() - now.getTime();

    return {
      isMonitoring: true,
      currentBedtime: this.currentBedtime,
      timeUntilBedtime: timeUntilBedtime > 0 ? timeUntilBedtime : 0,
    };
  }

  /**
   * Test bedtime monitoring (for debugging)
   */
  static testBedtimeMonitoring(): void {
    console.log('Testing bedtime monitoring...');
    alert('🧪 Test bedtime monitoring started! Check console for details.');
    
    // Simple test - trigger immediately
    setTimeout(() => {
      console.log('🎉 Test bedtime reached!');
      alert('🌙 Test bedtime notification triggered!');
    }, 3000); // 3 seconds instead of 10
  }
}
