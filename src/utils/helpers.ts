export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = end.getTime() - start.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getMotivationalMessage = (points: number, streak: number): string => {
  if (points >= 10) return 'Outstanding sleep! Your sheep is so proud! 🌟';
  if (points >= 5) return 'Excellent work! You\'re building great habits! 💪';
  if (points >= 0) return 'Good job! Every night counts! 🌙';
  if (streak >= 7) return 'Your streak is amazing! Keep it up! 🔥';
  return 'Don\'t worry, tomorrow is a new opportunity! 🌅';
};

export const getStreakMessage = (streak: number): string => {
  if (streak === 0) return 'Start your streak!';
  if (streak === 1) return 'Great start!';
  if (streak < 7) return `${streak} days strong!`;
  if (streak < 14) return 'Amazing streak!';
  return 'Incredible dedication!';
};

export const getPointsMessage = (points: number): string => {
  if (points < 50) return 'Keep going!';
  if (points < 100) return 'You\'re doing great!';
  if (points < 250) return 'Excellent progress!';
  return 'Outstanding!';
};

export const generateSleepId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const isValidTime = (timeString: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

export const calculateSleepEfficiency = (timeInBed: number, timeAsleep: number): number => {
  if (timeInBed === 0) return 0;
  return Math.round((timeAsleep / timeInBed) * 100);
};

export const getSleepQuality = (efficiency: number): string => {
  if (efficiency >= 85) return 'Excellent';
  if (efficiency >= 75) return 'Good';
  if (efficiency >= 65) return 'Fair';
  return 'Poor';
};
