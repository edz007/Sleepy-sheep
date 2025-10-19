import { SleepSession, UserSettings } from '../types';
import { TimezoneUtils } from './timezoneUtils';

export interface PointsBreakdown {
  bedtimePoints: number;
  checkInPoints: number;
  streakBonus: number;
  phoneUsagePenalty: number;
  snoozePenalty: number;
  totalPoints: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string;
  isActive: boolean;
}

export class PointsCalculator {
  // Base points for bedtime accuracy
  static calculateBedtimePoints(bedtime: Date, targetBedtime: string): number {
    const [targetHours, targetMinutes] = targetBedtime.split(':').map(Number);
    const targetTime = TimezoneUtils.createLocalDateTime(targetBedtime);
    
    const actualTime = new Date(bedtime);
    
    const diffMinutes = Math.abs(targetTime.getTime() - actualTime.getTime()) / (1000 * 60);
    
    console.log('Bedtime calculation:', {
      targetBedtime,
      actualBedtime: actualTime.toLocaleTimeString(),
      diffMinutes,
      targetTime: targetTime.toLocaleTimeString(),
      actualTime: actualTime.toLocaleTimeString()
    });
    
    if (diffMinutes <= 0) {
      return 10; // Perfect timing
    } else if (diffMinutes <= 15) {
      return 5; // Within 15 minutes
    } else if (diffMinutes <= 30) {
      return 2; // Within 30 minutes
    } else {
      return 0; // Late sleep
    }
  }

  // Points for check-ins during sleep
  static calculateCheckInPoints(checkInsCompleted: number, totalCheckIns: number): number {
    if (totalCheckIns === 0) return 0;
    
    const completionRate = checkInsCompleted / totalCheckIns;
    
    if (completionRate >= 0.8) {
      return 5; // Excellent check-in rate
    } else if (completionRate >= 0.6) {
      return 3; // Good check-in rate
    } else if (completionRate >= 0.4) {
      return 1; // Fair check-in rate
    } else {
      return 0; // Poor check-in rate
    }
  }

  // Streak bonus points
  static calculateStreakBonus(currentStreak: number): number {
    if (currentStreak >= 30) {
      return 50; // Monthly streak
    } else if (currentStreak >= 14) {
      return 30; // Two-week streak
    } else if (currentStreak >= 7) {
      return 20; // Weekly streak
    } else if (currentStreak >= 3) {
      return 10; // Three-day streak
    } else {
      return 0; // No streak bonus
    }
  }

  // Penalty for phone usage during sleep
  static calculatePhoneUsagePenalty(phoneUsageMinutes: number): number {
    const penaltyPer5Minutes = 1;
    return Math.floor(phoneUsageMinutes / 5) * penaltyPer5Minutes;
  }

  // Penalty for snoozing alarm
  static calculateSnoozePenalty(snoozeCount: number): number {
    if (snoozeCount === 0) return 0;
    if (snoozeCount === 1) return 3;
    if (snoozeCount === 2) return 5;
    return snoozeCount * 3; // 3 points per snooze after the first two
  }

  // Calculate total points for a sleep session
  static calculateSessionPoints(
    session: SleepSession,
    settings: UserSettings,
    currentStreak: number,
    phoneUsageMinutes: number = 0
  ): PointsBreakdown {
    const bedtimePoints = this.calculateBedtimePoints(
      new Date(session.bedtime),
      settings.bedtime_target
    );

    const checkInPoints = this.calculateCheckInPoints(
      Math.max(0, 6 - session.check_ins_missed), // Assuming 6 total check-ins
      6
    );

    const streakBonus = this.calculateStreakBonus(currentStreak);
    const phoneUsagePenalty = this.calculatePhoneUsagePenalty(phoneUsageMinutes);
    const snoozePenalty = this.calculateSnoozePenalty(session.snooze_count);

    const totalPoints = Math.max(0, 
      bedtimePoints + 
      checkInPoints + 
      streakBonus - 
      phoneUsagePenalty - 
      snoozePenalty
    );

    return {
      bedtimePoints,
      checkInPoints,
      streakBonus,
      phoneUsagePenalty,
      snoozePenalty,
      totalPoints,
    };
  }
}

export class StreakCalculator {
  // Calculate if streak should continue or reset
  static calculateStreak(
    lastSleepDate: string,
    currentDate: string,
    previousStreak: number
  ): StreakInfo {
    const lastDate = new Date(lastSleepDate);
    const current = new Date(currentDate);
    const yesterday = new Date(current);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if last sleep was yesterday (continuing streak)
    if (lastDate.toDateString() === yesterday.toDateString()) {
      return {
        currentStreak: previousStreak + 1,
        longestStreak: Math.max(previousStreak + 1, previousStreak),
        streakStartDate: lastDate.toISOString(),
        isActive: true,
      };
    }

    // Check if last sleep was today (same day, no streak change)
    if (lastDate.toDateString() === current.toDateString()) {
      return {
        currentStreak: previousStreak,
        longestStreak: previousStreak,
        streakStartDate: lastDate.toISOString(),
        isActive: true,
      };
    }

    // Streak broken
    return {
      currentStreak: 0,
      longestStreak: previousStreak,
      streakStartDate: current.toISOString(),
      isActive: false,
    };
  }

  // Get streak milestones
  static getStreakMilestones(): number[] {
    return [3, 7, 14, 30, 60, 100];
  }

  // Check if streak milestone was reached
  static checkStreakMilestone(currentStreak: number, previousStreak: number): number | null {
    const milestones = this.getStreakMilestones();
    return milestones.find(milestone => 
      currentStreak >= milestone && previousStreak < milestone
    ) || null;
  }
}

export class SheepEvolution {
  // Sheep stage thresholds
  static readonly STAGE_THRESHOLDS = {
    baby: 0,
    fluffy: 50,
    dreamy: 200,
    cloud_guardian: 500,
  };

  // Stage to level mapping
  static readonly STAGE_LEVELS = {
    baby: 1,
    fluffy: 2,
    dreamy: 3,
    cloud_guardian: 4,
  };

  // Get sheep stage based on total points
  static getSheepStage(totalPoints: number): keyof typeof SheepEvolution.STAGE_THRESHOLDS {
    if (totalPoints >= this.STAGE_THRESHOLDS.cloud_guardian) {
      return 'cloud_guardian';
    } else if (totalPoints >= this.STAGE_THRESHOLDS.dreamy) {
      return 'dreamy';
    } else if (totalPoints >= this.STAGE_THRESHOLDS.fluffy) {
      return 'fluffy';
    } else {
      return 'baby';
    }
  }

  // Check if sheep should evolve
  static shouldEvolve(currentStage: string, totalPoints: number): boolean {
    const newStage = this.getSheepStage(totalPoints);
    return newStage !== currentStage;
  }

  // Get points needed for next evolution
  static getPointsToNextStage(currentStage: string, totalPoints: number): number {
    const stages = Object.entries(this.STAGE_THRESHOLDS).sort((a, b) => a[1] - b[1]);
    const currentIndex = stages.findIndex(([stage]) => stage === currentStage);
    
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return 0; // Already at max stage
    }
    
    const nextStage = stages[currentIndex + 1];
    return Math.max(0, nextStage[1] - totalPoints);
  }

  // Get level number for a stage
  static getLevelNumber(stage: string): number {
    return this.STAGE_LEVELS[stage as keyof typeof this.STAGE_LEVELS] || 1;
  }

  // Get evolution message with level indicator
  static getEvolutionMessage(newStage: string): string {
    const level = this.getLevelNumber(newStage);
    const messages = {
      fluffy: `Your sheep evolved to Level ${level}! 🐑✨`,
      dreamy: `Your sheep evolved to Level ${level}! 🐑🌙`,
      cloud_guardian: `Your sheep evolved to Level ${level}! 🐑👑`,
    };
    
    return messages[newStage as keyof typeof messages] || `Your sheep evolved to Level ${level}! 🎉`;
  }

  // Get stage name with level
  static getStageNameWithLevel(stage: string): string {
    const level = this.getLevelNumber(stage);
    const stageNames = {
      baby: `Baby Sheep (Level ${level})`,
      fluffy: `Fluffy Sheep (Level ${level})`,
      dreamy: `Dreamy Sheep (Level ${level})`,
      cloud_guardian: `Cloud Guardian (Level ${level})`,
    };
    
    return stageNames[stage as keyof typeof stageNames] || `Sheep (Level ${level})`;
  }
}

export class AchievementSystem {
  // Achievement definitions
  static readonly ACHIEVEMENTS = {
    FIRST_SLEEP: {
      id: 'first_sleep',
      name: 'First Sleep',
      description: 'Complete your first sleep session',
      points: 10,
      icon: '🌙',
    },
    EARLY_BIRD: {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Sleep on time for 3 days in a row',
      points: 25,
      icon: '🐦',
    },
    WEEK_WARRIOR: {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      points: 50,
      icon: '⚔️',
    },
    PERFECT_WEEK: {
      id: 'perfect_week',
      name: 'Perfect Week',
      description: 'Sleep perfectly on time for 7 days',
      points: 100,
      icon: '⭐',
    },
    MONTH_MASTER: {
      id: 'month_master',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      points: 200,
      icon: '👑',
    },
    SHEEP_EVOLVER: {
      id: 'sheep_evolver',
      name: 'Sheep Evolver',
      description: 'Evolve your sheep to the next stage',
      points: 75,
      icon: '🐑',
    },
  };

  // Check if user earned an achievement
  static checkAchievements(
    totalPoints: number,
    currentStreak: number,
    previousStreak: number,
    sessionsCompleted: number,
    sheepStage: string,
    previousSheepStage: string
  ): Array<typeof AchievementSystem.ACHIEVEMENTS[keyof typeof AchievementSystem.ACHIEVEMENTS]> {
    const earnedAchievements = [];

    // First sleep
    if (sessionsCompleted === 1) {
      earnedAchievements.push(this.ACHIEVEMENTS.FIRST_SLEEP);
    }

    // Early bird (3-day streak)
    if (currentStreak >= 3 && previousStreak < 3) {
      earnedAchievements.push(this.ACHIEVEMENTS.EARLY_BIRD);
    }

    // Week warrior (7-day streak)
    if (currentStreak >= 7 && previousStreak < 7) {
      earnedAchievements.push(this.ACHIEVEMENTS.WEEK_WARRIOR);
    }

    // Month master (30-day streak)
    if (currentStreak >= 30 && previousStreak < 30) {
      earnedAchievements.push(this.ACHIEVEMENTS.MONTH_MASTER);
    }

    // Sheep evolver
    if (sheepStage !== previousSheepStage) {
      earnedAchievements.push(this.ACHIEVEMENTS.SHEEP_EVOLVER);
    }

    return earnedAchievements;
  }
}
