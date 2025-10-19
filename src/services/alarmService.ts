// import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Mock Audio for web compatibility
const Audio = {
  Sound: {
    createAsync: async (source: any, options: any) => {
      console.log('Audio not available on web:', source, options);
      return { sound: null };
    },
  },
  setAudioModeAsync: async (options: any) => {
    console.log('Audio mode not available on web:', options);
  },
};

export interface AlarmSound {
  id: string;
  name: string;
  emoji: string;
  file: string;
  pointsRequired?: number;
}

export interface AlarmSettings {
  wakeTime: string;
  soundId: string;
  snoozeEnabled: boolean;
  snoozeInterval: number; // minutes
  maxSnoozes: number;
  vibrationEnabled: boolean;
}

export class AlarmService {
  private static sound: Audio.Sound | null = null;
  private static isPlaying = false;
  private static snoozeCount = 0;
  private static currentAlarmId: string | null = null;

  // Available alarm sounds
  static readonly ALARM_SOUNDS: AlarmSound[] = [
    {
      id: 'default',
      name: 'Gentle Chime',
      emoji: '🔔',
      file: 'alarm_default.mp3',
    },
    {
      id: 'harp',
      name: 'Harp Melody',
      emoji: '🎵',
      file: 'alarm_harp.mp3',
      pointsRequired: 100,
    },
    {
      id: 'xylophone',
      name: 'Xylophone',
      emoji: '🎼',
      file: 'alarm_xylophone.mp3',
      pointsRequired: 250,
    },
    {
      id: 'chime',
      name: 'Crystal Chime',
      emoji: '💎',
      file: 'alarm_chime.mp3',
      pointsRequired: 500,
    },
  ];

  // Initialize alarm service
  static async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error initializing alarm service:', error);
    }
  }

  // Schedule alarm for wake time
  static async scheduleAlarm(settings: AlarmSettings): Promise<string> {
    try {
      // Cancel existing alarm
      if (this.currentAlarmId) {
        await Notifications.cancelScheduledNotificationAsync(this.currentAlarmId);
      }

      const [hours, minutes] = settings.wakeTime.split(':').map(Number);
      const alarmTime = new Date();
      alarmTime.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (alarmTime <= new Date()) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }

      const alarmId = `alarm_${Date.now()}`;
      this.currentAlarmId = alarmId;

      await Notifications.scheduleNotificationAsync({
        identifier: alarmId,
        content: {
          title: 'Good Morning! ☀️',
          body: 'Time to wake up! Your sheep is excited to see you!',
          sound: 'default',
          categoryIdentifier: 'alarm',
          data: { 
            type: 'alarm',
            soundId: settings.soundId,
            snoozeEnabled: settings.snoozeEnabled,
            snoozeInterval: settings.snoozeInterval,
            maxSnoozes: settings.maxSnoozes,
          },
        },
        trigger: {
          date: alarmTime,
          repeats: true,
        },
      });

      console.log('Alarm scheduled for:', alarmTime);
      return alarmId;
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      throw error;
    }
  }

  // Play alarm sound
  static async playAlarmSound(soundId: string): Promise<void> {
    try {
      // Stop current sound if playing
      if (this.sound && this.isPlaying) {
        await this.stopAlarmSound();
      }

      const soundConfig = this.ALARM_SOUNDS.find(s => s.id === soundId) || this.ALARM_SOUNDS[0];
      
      // Load and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: `asset:///src/assets/sounds/${soundConfig.file}` },
        { 
          shouldPlay: true,
          isLooping: true,
          volume: 0.8,
        }
      );

      this.sound = sound;
      this.isPlaying = true;

      console.log('Playing alarm sound:', soundConfig.name);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback to system sound
      await Notifications.presentNotificationAsync({
        title: 'Alarm',
        body: 'Wake up!',
        sound: 'default',
      });
    }
  }

  // Stop alarm sound
  static async stopAlarmSound(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
      }
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  }

  // Handle snooze
  static async snoozeAlarm(settings: AlarmSettings): Promise<void> {
    try {
      this.snoozeCount++;
      
      if (this.snoozeCount > settings.maxSnoozes) {
        console.log('Max snoozes reached');
        return;
      }

      // Stop current alarm
      await this.stopAlarmSound();

      // Schedule snooze alarm
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + settings.snoozeInterval);

      const snoozeId = `snooze_${Date.now()}`;

      await Notifications.scheduleNotificationAsync({
        identifier: snoozeId,
        content: {
          title: 'Snooze Alarm ⏰',
          body: `Wake up! (Snooze ${this.snoozeCount}/${settings.maxSnoozes})`,
          sound: 'default',
          categoryIdentifier: 'alarm',
          data: { 
            type: 'snooze',
            snoozeCount: this.snoozeCount,
            soundId: settings.soundId,
          },
        },
        trigger: {
          date: snoozeTime,
        },
      });

      console.log(`Snooze ${this.snoozeCount} scheduled for:`, snoozeTime);
    } catch (error) {
      console.error('Error snoozing alarm:', error);
    }
  }

  // Dismiss alarm
  static async dismissAlarm(): Promise<void> {
    try {
      await this.stopAlarmSound();
      this.snoozeCount = 0;
      this.currentAlarmId = null;
      console.log('Alarm dismissed');
    } catch (error) {
      console.error('Error dismissing alarm:', error);
    }
  }

  // Get available alarm sounds for user
  static getAvailableSounds(userPoints: number): AlarmSound[] {
    return this.ALARM_SOUNDS.filter(sound => 
      !sound.pointsRequired || userPoints >= sound.pointsRequired
    );
  }

  // Calculate snooze penalty
  static calculateSnoozePenalty(snoozeCount: number): number {
    if (snoozeCount === 0) return 0;
    if (snoozeCount === 1) return 3;
    if (snoozeCount === 2) return 5;
    return snoozeCount * 3; // 3 points per snooze after the first two
  }

  // Cancel all alarms
  static async cancelAllAlarms(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.stopAlarmSound();
      this.snoozeCount = 0;
      this.currentAlarmId = null;
      console.log('All alarms cancelled');
    } catch (error) {
      console.error('Error cancelling alarms:', error);
    }
  }

  // Get alarm status
  static getAlarmStatus(): {
    isPlaying: boolean;
    snoozeCount: number;
    currentAlarmId: string | null;
  } {
    return {
      isPlaying: this.isPlaying,
      snoozeCount: this.snoozeCount,
      currentAlarmId: this.currentAlarmId,
    };
  }

  // Setup alarm notification categories
  static async setupAlarmCategories(): Promise<void> {
    try {
      // Skip alarm categories on web as they're not supported
      if (Platform.OS === 'web') {
        console.log('Skipping alarm categories setup on web');
        return;
      }

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
    } catch (error) {
      console.error('Error setting up alarm categories:', error);
    }
  }
}