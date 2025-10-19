import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser, createGuestUser } from '../services/supabase';
import { LocalStorageService } from '../services/localStorage';
import { NotificationService } from '../services/notificationService';
import { AlarmService } from '../services/alarmService';
// import { BedtimeReminderService } from '../services/bedtimeReminderService';
import { SleepSession, UserSettings, SleepContextType } from '../types';
import { PointsCalculator, StreakCalculator, AchievementSystem } from '../utils/pointsCalculator';
import { TimezoneUtils } from '../utils/timezoneUtils';
import { Alert } from 'react-native';

const SleepContext = createContext<SleepContextType | undefined>(undefined);

export const SleepProvider: React.FC<{ children: React.ReactNode; onPointsEarned?: (points: number) => void }> = ({ children, onPointsEarned }) => {
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(null);
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);

  // Initialize user and settings
  useEffect(() => {
    initializeUser();
    initializeAlarmService();
  }, []);

  const initializeAlarmService = async () => {
    try {
      await AlarmService.initialize();
      await AlarmService.setupAlarmCategories();
    } catch (error) {
      console.error('Error initializing alarm service:', error);
    }
  };

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Try to get current user, create guest if none exists
      let user = await getCurrentUser();
      if (!user) {
        user = await createGuestUser();
      }

      if (user) {
        await loadUserSettings(user.id);
        await loadActiveSession(user.id);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async (userId: string) => {
    try {
      console.log('Loading user settings for user:', userId);
      
      // If it's a local user, use local storage
      if (userId === 'local-user') {
        console.log('Using local storage for settings');
        const localSettings = await LocalStorageService.getSettings();
        const userSettings: UserSettings = {
          user_id: userId,
          bedtime_target: localSettings.bedtime_target,
          wake_time_target: localSettings.wake_time_target,
          notification_enabled: localSettings.notification_enabled,
          check_in_interval: localSettings.check_in_interval,
          created_at: new Date().toISOString(),
          updated_at: localSettings.updated_at,
        };
        console.log('Settings loaded from local storage:', userSettings);
        setSettings(userSettings);
        
        // Start bedtime monitoring for local user
        // if (userSettings.notification_enabled && userSettings.bedtime_target) {
        //   BedtimeReminderService.startBedtimeMonitoring(
        //     userSettings.bedtime_target,
        //     () => {
        //       console.log('🌙 Bedtime reached for local user!');
        //     }
        //   );
        // }
        return;
      }
      
      // Otherwise, try to load from Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading settings:', error);
        throw error;
      }

      if (data) {
        console.log('Settings loaded from database:', data);
        setSettings(data);
        
        // Start bedtime monitoring for database user
        // if (data.notification_enabled && data.bedtime_target) {
        //   BedtimeReminderService.startBedtimeMonitoring(
        //     data.bedtime_target,
        //     () => {
        //       console.log('🌙 Bedtime reached for database user!');
        //     }
        //   );
        // }
      } else {
        // Create default settings
        const defaultSettings: Partial<UserSettings> = {
          user_id: userId,
          bedtime_target: '22:00:00',
          wake_time_target: '07:00:00',
          notification_enabled: true,
          check_in_interval: 30,
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadActiveSession = async (userId: string) => {
    try {
      // Skip Supabase queries for local users
      if (userId === 'local-user') {
        console.log('Skipping active session load for local user');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('sleep_date', today)
        .is('wake_time', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCurrentSession(data);
        setIsSleepMode(true);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  };

  const startSleepSession = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const bedtimeTimestamp = TimezoneUtils.getLocalISOString();
      const sleepDate = TimezoneUtils.getLocalDateString();
      
      console.log('Creating sleep session with bedtime:', bedtimeTimestamp);
      console.log('Sleep date:', sleepDate);
      TimezoneUtils.logTimezoneInfo();
      
      const newSession: Partial<SleepSession> = {
        user_id: user.id,
        bedtime: bedtimeTimestamp,
        sleep_date: sleepDate,
        points_earned: 0,
        check_ins_missed: 0,
        snooze_count: 0,
      };

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Starting sleep session for local user');
        // Create a mock session for local storage mode
        const localSession: SleepSession = {
          id: `local-session-${Date.now()}`,
          user_id: user.id,
          bedtime: newSession.bedtime!,
          wake_time: undefined,
          sleep_date: newSession.sleep_date!,
          points_earned: 0,
          check_ins_missed: 0,
          snooze_count: 0,
          created_at: new Date().toISOString(),
        };
        
        setCurrentSession(localSession);
        setIsSleepMode(true);
        console.log('Local sleep session started:', localSession);
        console.log('Bedtime timestamp stored:', localSession.bedtime);
        console.log('Sleep date stored:', localSession.sleep_date);
        return;
      }

      const { data, error } = await supabase
        .from('sleep_sessions')
        .insert(newSession)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      setIsSleepMode(true);

      // Schedule check-in notifications
      if (settings?.notification_enabled && settings?.check_in_interval) {
        await NotificationService.scheduleCheckInNotifications(settings.check_in_interval);
      }

      console.log('Sleep session started:', data);
    } catch (error) {
      console.error('Error starting sleep session:', error);
    }
  };

  const endSleepSession = async () => {
    console.log('endSleepSession called');
    console.log('currentSession:', currentSession);
    console.log('settings:', settings);
    
    if (!currentSession || !settings) {
      console.log('Missing currentSession or settings, returning early');
      return;
    }

    try {
      const wakeTime = TimezoneUtils.getLocalISOString();
      const bedtime = new Date(currentSession.bedtime);
      
      console.log('Wake time:', wakeTime);
      console.log('Bedtime:', bedtime);
      TimezoneUtils.logTimezoneInfo();
      
      // Get current user data for streak calculation
      const user = await getCurrentUser();
      if (!user) {
        console.log('No user found, returning early');
        return;
      }

      console.log('User found:', user.id);

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Ending sleep session for local user');
        
        // Calculate points for local session (1 point per second for testing)
        const sleepDurationSeconds = (new Date(wakeTime).getTime() - bedtime.getTime()) / 1000;
        const basePoints = Math.floor(sleepDurationSeconds); // 1 point per second
        const bonusPoints = currentSession.check_ins_missed === 0 ? 20 : 0; // Bonus for no missed check-ins
        const totalPoints = basePoints + bonusPoints;
        
        console.log('Sleep duration seconds:', sleepDurationSeconds);
        console.log('Base points:', basePoints);
        console.log('Bonus points:', bonusPoints);
        console.log('Total points:', totalPoints);
        
        // Add points to user's total
        if (onPointsEarned) {
          onPointsEarned(totalPoints);
        }
        
        // Update local session
        const updatedSession = {
          ...currentSession,
          wake_time: wakeTime,
          points_earned: totalPoints,
        };
        
        setCurrentSession(null);
        setIsSleepMode(false);
        
        console.log('Local sleep session ended. Points earned:', totalPoints);
        console.log('Session state cleared - currentSession:', null, 'isSleepMode:', false);
        
        // Show success message with points earned (commented out for web compatibility)
        // Alert.alert(
        //   'Good Morning! ☀️',
        //   `You earned ${totalPoints} points for sleeping!\n\nSleep Duration: ${Math.floor(sleepDurationSeconds / 60)} minutes\nBase Points: ${basePoints}\nBonus Points: ${bonusPoints}`,
        //   [{ text: 'Ready for the Day!', style: 'default' }]
        // );
        
        return;
      }

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('total_points, current_streak, sheep_stage')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Calculate comprehensive points breakdown
      const pointsBreakdown = PointsCalculator.calculateSessionPoints(
        currentSession,
        settings,
        userData?.current_streak || 0,
        0 // phoneUsageMinutes - could be tracked in future
      );

      // Calculate streak
      const streakInfo = StreakCalculator.calculateStreak(
        currentSession.sleep_date,
        new Date().toISOString().split('T')[0],
        userData?.current_streak || 0
      );

      // Check for achievements
      const newAchievements = AchievementSystem.checkAchievements(
        (userData?.total_points || 0) + pointsBreakdown.totalPoints,
        streakInfo.currentStreak,
        userData?.current_streak || 0,
        1, // sessionsCompleted - would need to track this
        userData?.sheep_stage || 'baby',
        userData?.sheep_stage || 'baby'
      );

      // Show achievements if any
      if (newAchievements.length > 0) {
        setCurrentAchievement(newAchievements[0]);
        setShowAchievement(true);
      }

      // Update sleep session with points
      const { error } = await supabase
        .from('sleep_sessions')
        .update({
          wake_time: wakeTime,
          points_earned: pointsBreakdown.totalPoints,
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      // Update user's total points and streak
      await updateUserStats(pointsBreakdown.totalPoints, streakInfo);

      // Cancel any remaining notifications
      await NotificationService.cancelAllNotifications();

      setCurrentSession(null);
      setIsSleepMode(false);

      console.log('Sleep session ended. Points breakdown:', pointsBreakdown);
    } catch (error) {
      console.error('Error ending sleep session:', error);
    }
  };

  const updateUserStats = async (pointsEarned: number, streakInfo?: any) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Skipping user stats update for local user');
        return;
      }

      // Get current user data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('total_points, current_streak')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const newTotalPoints = (userData?.total_points || 0) + pointsEarned;
      const newStreak = streakInfo ? streakInfo.currentStreak : (userData?.current_streak || 0);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_points: newTotalPoints,
          current_streak: newStreak,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      console.log('User stats updated. Total points:', newTotalPoints, 'Streak:', newStreak);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const checkIn = async () => {
    if (!currentSession) return;

    try {
      // Skip Supabase queries for local users
      if (currentSession.user_id === 'local-user') {
        console.log('Skipping check-in update for local user');
        // Update local state only
        setCurrentSession(prev => prev ? {
          ...prev,
          check_ins_missed: Math.max(0, prev.check_ins_missed - 1),
        } : null);
        return;
      }

      // Update the session to show user is still awake
      const { error } = await supabase
        .from('sleep_sessions')
        .update({
          check_ins_missed: Math.max(0, currentSession.check_ins_missed - 1),
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      // Update local state
      setCurrentSession(prev => prev ? {
        ...prev,
        check_ins_missed: Math.max(0, prev.check_ins_missed - 1),
      } : null);

      console.log('Check-in recorded');
    } catch (error) {
      console.error('Error recording check-in:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('No user found for updateSettings, updating local state only');
        // Update local state only if no user
        const updatedSettings = { ...settings, ...newSettings } as UserSettings;
        setSettings(updatedSettings);
        return;
      }

      console.log('Updating settings:', newSettings);
      console.log('Current settings before update:', settings);

      // If it's a local user, use local storage
      if (user.id === 'local-user') {
        console.log('Saving settings to local storage');
        await LocalStorageService.saveSettings({
          bedtime_target: newSettings.bedtime_target || settings?.bedtime_target || '22:00',
          wake_time_target: newSettings.wake_time_target || settings?.wake_time_target || '07:00',
          notification_enabled: newSettings.notification_enabled !== undefined ? newSettings.notification_enabled : (settings?.notification_enabled || true),
          check_in_interval: newSettings.check_in_interval || settings?.check_in_interval || 30,
        });
        
        // Update local state
        const updatedSettings = { ...settings, ...newSettings } as UserSettings;
        setSettings(updatedSettings);
        console.log('Settings updated in local storage and state:', updatedSettings);
        return;
      }

      // Otherwise, save to Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Settings saved to database:', data);

      // Update local state with the data returned from database
      setSettings(data);

      // Reschedule notifications if bedtime/wake time changed
      if (newSettings.bedtime_target && data.notification_enabled) {
        // Start bedtime monitoring with the new bedtime
        // BedtimeReminderService.startBedtimeMonitoring(
        //   newSettings.bedtime_target,
        //   () => {
        //     console.log('🌙 Bedtime reached! Starting sleep session...');
        //     // Optionally auto-start sleep session when bedtime is reached
        //     // startSleepSession();
        //   }
        // );
        
        // Also schedule traditional notification for mobile
        await NotificationService.scheduleBedtimeReminder(newSettings.bedtime_target);
      }
      if (newSettings.wake_time_target && data.notification_enabled) {
        await NotificationService.scheduleWakeUpAlarm(newSettings.wake_time_target);
        
        // Also schedule alarm with AlarmService
        await AlarmService.scheduleAlarm({
          wakeTime: newSettings.wake_time_target,
          soundId: 'default',
          snoozeEnabled: true,
          snoozeInterval: 5,
          maxSnoozes: 3,
          vibrationEnabled: true,
        });
      }

      console.log('Settings updated:', data);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const refreshSettings = async () => {
    try {
      console.log('Refreshing settings...');
      const user = await getCurrentUser();
      if (user) {
        console.log('User found, loading settings for user:', user.id);
        await loadUserSettings(user.id);
      } else {
        console.log('No user found for refreshSettings, using default settings');
        // Set default settings if no user can be created
        const defaultSettings: UserSettings = {
          user_id: 'local-user',
          bedtime_target: '22:00:00',
          wake_time_target: '07:00:00',
          notification_enabled: true,
          check_in_interval: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  const value: SleepContextType = {
    currentSession,
    isSleepMode,
    startSleepSession,
    endSleepSession,
    checkIn,
    settings,
    updateSettings,
    loading,
    refreshSettings,
    onPointsEarned,
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
};

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (context === undefined) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};