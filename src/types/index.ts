export interface User {
  id: string;
  created_at: string;
  current_streak: number;
  total_points: number;
  sheep_stage: 'baby' | 'fluffy' | 'dreamy' | 'cloud_guardian';
}

export interface SleepSession {
  id: string;
  user_id: string;
  bedtime: string;
  wake_time?: string;
  points_earned: number;
  sleep_date: string;
  check_ins_missed: number;
  snooze_count: number;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  bedtime_target: string;
  wake_time_target: string;
  notification_enabled: boolean;
  check_in_interval: number;
  created_at: string;
  updated_at: string;
}

export interface SleepContextType {
  currentSession: SleepSession | null;
  isSleepMode: boolean;
  startSleepSession: () => Promise<void>;
  endSleepSession: () => Promise<void>;
  checkIn: () => Promise<void>;
  settings: UserSettings | null;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  onPointsEarned?: (points: number) => void; // Callback for when points are earned
}

export interface SheepContextType {
  sheepStage: 'baby' | 'fluffy' | 'dreamy' | 'cloud_guardian';
  sheepMood: 'happy' | 'sleeping' | 'sad' | 'excited' | 'yawning';
  totalPoints: number;
  currentStreak: number;
  updateSheepStage: (stage: SheepContextType['sheepStage']) => void;
  updateSheepMood: (mood: SheepContextType['sheepMood']) => void;
  addPoints: (points: number) => void;
  updateStreak: (streak: number) => void;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}