import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepState, SleepSession } from '@/types';

const STORAGE_KEYS = {
  SLEEP_STATE: 'sleep_state',
  CURRENT_SESSION: 'current_session',
  MISSED_CHECK_INS: 'missed_check_ins',
};

export class SleepTrackingService {
  private static instance: SleepTrackingService;
  private checkInTimer: NodeJS.Timeout | null = null;
  private checkInInterval: number = 30; // minutes

  static getInstance(): SleepTrackingService {
    if (!SleepTrackingService.instance) {
      SleepTrackingService.instance = new SleepTrackingService();
    }
    return SleepTrackingService.instance;
  }

  async startSleepSession(bedtime: Date): Promise<void> {
    const session: Partial<SleepSession> = {
      bedtime: bedtime.toISOString(),
      sleep_date: new Date().toISOString().split('T')[0],
      check_ins_missed: 0,
      snooze_count: 0,
      points_earned: 0,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEYS.MISSED_CHECK_INS, '0');
    
    this.startCheckInTimer();
  }

  async endSleepSession(wakeTime: Date, snoozeCount: number = 0): Promise<SleepSession | null> {
    this.stopCheckInTimer();
    
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    const missedCheckIns = await AsyncStorage.getItem(STORAGE_KEYS.MISSED_CHECK_INS);
    
    if (!sessionData) return null;

    const session: SleepSession = {
      ...JSON.parse(sessionData),
      wake_time: wakeTime.toISOString(),
      snooze_count: snoozeCount,
      check_ins_missed: parseInt(missedCheckIns || '0'),
    } as SleepSession;

    // Clear session data
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.MISSED_CHECK_INS);

    return session;
  }

  async getCurrentSession(): Promise<SleepSession | null> {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async getMissedCheckIns(): Promise<number> {
    const missed = await AsyncStorage.getItem(STORAGE_KEYS.MISSED_CHECK_INS);
    return parseInt(missed || '0');
  }

  async confirmCheckIn(): Promise<void> {
    // Reset missed check-ins counter
    await AsyncStorage.setItem(STORAGE_KEYS.MISSED_CHECK_INS, '0');
  }

  private startCheckInTimer(): void {
    this.stopCheckInTimer(); // Clear any existing timer
    
    this.checkInTimer = setInterval(async () => {
      const currentMissed = await this.getMissedCheckIns();
      await AsyncStorage.setItem(STORAGE_KEYS.MISSED_CHECK_INS, (currentMissed + 1).toString());
    }, this.checkInInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  private stopCheckInTimer(): void {
    if (this.checkInTimer) {
      clearInterval(this.checkInTimer);
      this.checkInTimer = null;
    }
  }

  setCheckInInterval(minutes: number): void {
    this.checkInInterval = minutes;
  }

  async isSleeping(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  async getSleepDuration(): Promise<number | null> {
    const session = await this.getCurrentSession();
    if (!session) return null;

    const startTime = new Date(session.bedtime);
    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
  }
}
