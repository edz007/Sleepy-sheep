import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity 
} from 'react-native';
import { PointsBreakdown, StreakInfo } from '../utils/pointsCalculator';

interface PointsDisplayProps {
  totalPoints: number;
  currentStreak: number;
  sheepStage: string;
  pointsToNextStage?: number;
  breakdown?: PointsBreakdown;
  streakInfo?: StreakInfo;
  onPress?: () => void;
  showBreakdown?: boolean;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  totalPoints,
  currentStreak,
  sheepStage,
  pointsToNextStage = 0,
  breakdown,
  streakInfo,
  onPress,
  showBreakdown = false,
}) => {
  const pointsAnimation = useRef(new Animated.Value(0)).current;
  const streakAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate points display
    Animated.timing(pointsAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animate streak display
    Animated.timing(streakAnimation, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Pulse animation for attention
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [totalPoints, currentStreak]);

  const getSheepEmoji = (stage: string) => {
    const emojis = {
      baby: '🐑',
      fluffy: '🐑✨',
      dreamy: '🐑🌙',
      cloud_guardian: '☁️👑',
    };
    return emojis[stage as keyof typeof emojis] || '🐑';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '✨';
    return '💫';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#FFD700';
    if (streak >= 14) return '#FF6B6B';
    if (streak >= 7) return '#4ECDC4';
    if (streak >= 3) return '#45B7D1';
    return '#95A5A6';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Main Stats */}
      <View style={styles.mainStats}>
        <Animated.View 
          style={[
            styles.statCard,
            { 
              opacity: pointsAnimation,
              transform: [{ scale: pulseAnimation }] 
            }
          ]}
        >
          <Text style={styles.statNumber}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
          <Text style={styles.sheepEmoji}>{getSheepEmoji(sheepStage)}</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.statCard,
            { 
              opacity: streakAnimation,
              backgroundColor: getStreakColor(currentStreak),
            }
          ]}
        >
          <Text style={styles.statNumber}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.streakEmoji}>{getStreakEmoji(currentStreak)}</Text>
        </Animated.View>
      </View>

      {/* Progress to Next Stage */}
      {pointsToNextStage > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {pointsToNextStage} points to next evolution
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(100, ((totalPoints % 50) / 50) * 100)}%` 
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Points Breakdown */}
      {showBreakdown && breakdown && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Points Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Bedtime Accuracy</Text>
            <Text style={styles.breakdownValue}>+{breakdown.bedtimePoints}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Check-ins</Text>
            <Text style={styles.breakdownValue}>+{breakdown.checkInPoints}</Text>
          </View>
          
          {breakdown.streakBonus > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Streak Bonus</Text>
              <Text style={styles.breakdownValue}>+{breakdown.streakBonus}</Text>
            </View>
          )}
          
          {breakdown.phoneUsagePenalty > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Phone Usage</Text>
              <Text style={styles.breakdownValuePenalty}>-{breakdown.phoneUsagePenalty}</Text>
            </View>
          )}
          
          {breakdown.snoozePenalty > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Snooze Penalty</Text>
              <Text style={styles.breakdownValuePenalty}>-{breakdown.snoozePenalty}</Text>
            </View>
          )}
          
          <View style={styles.breakdownTotal}>
            <Text style={styles.breakdownLabel}>Total</Text>
            <Text style={styles.breakdownTotalValue}>{breakdown.totalPoints}</Text>
          </View>
        </View>
      )}

      {/* Streak Info */}
      {streakInfo && (
        <View style={styles.streakInfo}>
          <Text style={styles.streakInfoText}>
            {streakInfo.isActive 
              ? `Streak active since ${new Date(streakInfo.streakStartDate).toLocaleDateString()}`
              : 'Start a new streak today!'
            }
          </Text>
          {streakInfo.longestStreak > streakInfo.currentStreak && (
            <Text style={styles.longestStreakText}>
              Longest streak: {streakInfo.longestStreak} days
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    minHeight: 80,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
  },
  sheepEmoji: {
    fontSize: 20,
  },
  streakEmoji: {
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9B7EDE',
    borderRadius: 3,
  },
  breakdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  breakdownValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  breakdownValuePenalty: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  breakdownTotalValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakInfoText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 5,
  },
  longestStreakText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.6,
    textAlign: 'center',
  },
});

export default PointsDisplay;