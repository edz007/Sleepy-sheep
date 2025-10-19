import { SleepSession, User, PointsBreakdown } from '@/types';
import { POINTS_CONFIG, SHEEP_EVOLUTION_THRESHOLDS } from '@/config';

export class PointsEngine {
  static calculatePoints(
    bedtime: Date,
    actualSleepTime: Date,
    wakeTime: Date,
    actualWakeTime: Date,
    missedCheckIns: number,
    snoozeCount: number,
    currentStreak: number
  ): PointsBreakdown {
    const breakdown: PointsBreakdown = {
      timeAdherence: 0,
      checkIns: 0,
      snoozes: 0,
      streakBonus: 0,
      total: 0,
    };

    // Time adherence points
    const sleepTimeDiff = Math.abs(actualSleepTime.getTime() - bedtime.getTime()) / (1000 * 60); // minutes
    
    if (sleepTimeDiff <= 0) {
      breakdown.timeAdherence = POINTS_CONFIG.PERFECT_TIME; // Perfect timing
    } else if (sleepTimeDiff <= 15) {
      breakdown.timeAdherence = POINTS_CONFIG.GOOD_TIME; // Within 15 minutes
    } else {
      breakdown.timeAdherence = 0; // Late
    }

    // Check-in penalties (assuming 30-minute intervals)
    const checkInPenalty = missedCheckIns * 6; // -1 point per 5 minutes, 30 min = 6 points
    breakdown.checkIns = -checkInPenalty;

    // Snooze penalties
    if (snoozeCount === 1) {
      breakdown.snoozes = -POINTS_CONFIG.FIRST_SNOOZE_PENALTY;
    } else if (snoozeCount > 1) {
      breakdown.snoozes = -POINTS_CONFIG.FIRST_SNOOZE_PENALTY + ((snoozeCount - 1) * -POINTS_CONFIG.ADDITIONAL_SNOOZE_PENALTY);
    }

    // Streak bonus
    if (currentStreak >= POINTS_CONFIG.STREAK_THRESHOLD) {
      breakdown.streakBonus = POINTS_CONFIG.STREAK_BONUS;
    }

    breakdown.total = breakdown.timeAdherence + breakdown.checkIns + breakdown.snoozes + breakdown.streakBonus;
    
    return breakdown;
  }

  static calculateStreak(sessions: SleepSession[]): number {
    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort sessions by date (most recent first)
    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.sleep_date).getTime() - new Date(a.sleep_date).getTime()
    );

    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].sleep_date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      // Check if session is for the expected date and has positive points
      if (sessionDate.getTime() === expectedDate.getTime() && sortedSessions[i].points_earned > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  static getSheepStage(totalPoints: number): 'baby' | 'fluffy' | 'dreamy' | 'cloud_guardian' {
    if (totalPoints >= SHEEP_EVOLUTION_THRESHOLDS.cloud_guardian) return 'cloud_guardian';
    if (totalPoints >= SHEEP_EVOLUTION_THRESHOLDS.dreamy) return 'dreamy';
    if (totalPoints >= SHEEP_EVOLUTION_THRESHOLDS.fluffy) return 'fluffy';
    return 'baby';
  }

  static getSheepMood(
    recentPoints: number,
    currentStreak: number,
    isSleeping: boolean
  ): 'happy' | 'sleepy' | 'sad' | 'excited' {
    if (isSleeping) return 'sleepy';
    
    if (currentStreak >= 7) return 'excited';
    if (recentPoints >= 5) return 'happy';
    if (recentPoints < 0) return 'sad';
    
    return 'happy';
  }

  static getUnlockableItems(totalPoints: number, streak: number): Array<{type: string, id: string}> {
    const items: Array<{type: string, id: string}> = [];

    // Accessories based on points
    if (totalPoints >= 50) items.push({ type: 'accessory', id: 'hat_simple' });
    if (totalPoints >= 100) items.push({ type: 'accessory', id: 'scarf_cozy' });
    if (totalPoints >= 150) items.push({ type: 'accessory', id: 'glasses_cute' });
    if (totalPoints >= 200) items.push({ type: 'accessory', id: 'blanket_warm' });

    // Themes based on streak
    if (streak >= 7) items.push({ type: 'theme', id: 'meadow' });
    if (streak >= 14) items.push({ type: 'theme', id: 'moonlit_hill' });
    if (streak >= 30) items.push({ type: 'theme', id: 'cloud_realm' });

    // Sounds based on total points
    if (totalPoints >= 100) items.push({ type: 'sound', id: 'alarm_harp' });
    if (totalPoints >= 250) items.push({ type: 'sound', id: 'alarm_xylophone' });
    if (totalPoints >= 500) items.push({ type: 'sound', id: 'alarm_chime' });

    return items;
  }
}
