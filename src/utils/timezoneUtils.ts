/**
 * Timezone utility functions for consistent local time handling
 * Ensures all sleep tracking uses the device's local timezone
 */

export class TimezoneUtils {
  /**
   * Get current local time as ISO string (preserves timezone)
   * This is different from new Date().toISOString() which converts to UTC
   */
  static getLocalISOString(): string {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localTime = new Date(now.getTime() - timezoneOffset);
    return localTime.toISOString();
  }

  /**
   * Get current local date in YYYY-MM-DD format
   */
  static getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get current local time in HH:MM format
   */
  static getLocalTimeString(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Create a Date object for today with specific time in local timezone
   * @param timeString Time in HH:MM format (e.g., "22:00")
   */
  static createLocalDateTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today;
  }

  /**
   * Get the next occurrence of a specific time, accounting for cross-day scenarios
   * @param timeString Time in HH:MM format (e.g., "22:00")
   * @returns Date object for the next occurrence of this time
   */
  static getNextOccurrence(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);
    
    // If the target time has already passed today, it's for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime;
  }

  /**
   * Get today's occurrence of a specific time for checking if we've passed it
   * @param timeString Time in HH:MM format (e.g., "22:00")
   * @returns Date object for today's occurrence of this time
   */
  static getTodayOccurrence(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);
    return targetTime;
  }

  /**
   * Check if a specified number of minutes has passed since a given date
   * @param since The date to check from (null means no restriction)
   * @param minutes Number of minutes that must have passed
   * @returns true if enough time has passed or if since is null
   */
  static hasMinutesPassed(since: Date | null, minutes: number): boolean {
    if (!since) return true;
    
    const now = new Date();
    const diffMs = now.getTime() - since.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return diffMinutes >= minutes;
  }

  /**
   * Calculate difference in minutes between two times
   * @param time1 First time string (HH:MM)
   * @param time2 Second time string (HH:MM)
   */
  static getTimeDifferenceMinutes(time1: string, time2: string): number {
    const date1 = this.createLocalDateTime(time1);
    const date2 = this.createLocalDateTime(time2);
    return Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60));
  }

  /**
   * Check if current time is within X minutes of target bedtime
   * @param targetBedtime Target bedtime in HH:MM format
   * @param toleranceMinutes Tolerance in minutes (default: 15)
   */
  static isNearBedtime(targetBedtime: string, toleranceMinutes: number = 15): boolean {
    const now = new Date();
    const targetTime = this.createLocalDateTime(targetBedtime);
    const diffMinutes = Math.abs((now.getTime() - targetTime.getTime()) / (1000 * 60));
    return diffMinutes <= toleranceMinutes;
  }

  /**
   * Get bedtime status message for display
   * @param targetBedtime Target bedtime in HH:MM format
   */
  static getBedtimeStatus(targetBedtime: string): string {
    const now = new Date();
    const targetTime = this.createLocalDateTime(targetBedtime);
    const diffMinutes = Math.abs((now.getTime() - targetTime.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 15) {
      return 'Perfect bedtime! 🌙';
    } else if (now < targetTime) {
      return `${Math.round(diffMinutes)} minutes until bedtime`;
    } else {
      return `${Math.round(diffMinutes)} minutes past bedtime`;
    }
  }

  /**
   * Calculate sleep duration in hours between bedtime and wake time
   * @param bedtime ISO string of bedtime
   * @param wakeTime ISO string of wake time
   */
  static calculateSleepDuration(bedtime: string, wakeTime: string): number {
    const bedtimeDate = new Date(bedtime);
    const wakeTimeDate = new Date(wakeTime);
    return (wakeTimeDate.getTime() - bedtimeDate.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Format time for display (12-hour format with AM/PM)
   * @param timeString Time in HH:MM format
   */
  static formatTimeForDisplay(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  /**
   * Get device timezone offset in minutes
   */
  static getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  /**
   * Get device timezone name (if available)
   */
  static getTimezoneName(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Local Time';
    }
  }

  /**
   * Debug function to log current timezone info
   */
  static logTimezoneInfo(): void {
    const now = new Date();
    console.log('=== Timezone Debug Info ===');
    console.log('Current time:', now.toString());
    console.log('UTC time:', now.toISOString());
    console.log('Local ISO:', this.getLocalISOString());
    console.log('Local date:', this.getLocalDateString());
    console.log('Local time:', this.getLocalTimeString());
    console.log('Timezone offset (minutes):', this.getTimezoneOffset());
    console.log('Timezone name:', this.getTimezoneName());
    console.log('========================');
  }
}
