// Environment configuration
export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key',
  },
  debug: process.env.EXPO_PUBLIC_DEBUG === 'true',
};

// Demo user ID for development
export const DEMO_USER_ID = 'demo-user-id';

// Default settings for new users
export const DEFAULT_SETTINGS = {
  bedtime_target: '22:00:00',
  wake_time_target: '07:00:00',
  notification_enabled: true,
  check_in_interval: 30,
};

// Sheep evolution thresholds
export const SHEEP_EVOLUTION_THRESHOLDS = {
  baby: 0,
  fluffy: 100,
  dreamy: 250,
  cloud_guardian: 500,
};

// Points system configuration
export const POINTS_CONFIG = {
  PERFECT_TIME: 10,
  GOOD_TIME: 5,
  CHECK_IN_PENALTY_PER_5MIN: 1,
  FIRST_SNOOZE_PENALTY: 3,
  ADDITIONAL_SNOOZE_PENALTY: 5,
  STREAK_BONUS: 20,
  STREAK_THRESHOLD: 7,
};

// Unlockable thresholds
export const UNLOCK_THRESHOLDS = {
  ACCESSORY_EVERY_POINTS: 50,
  THEME_7_DAY_STREAK: 7,
  THEME_14_DAY_STREAK: 14,
  THEME_30_DAY_STREAK: 30,
  SOUND_100_POINTS: 100,
  SOUND_250_POINTS: 250,
  SOUND_500_POINTS: 500,
};
