import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSleep } from '../contexts/SleepContext';
import { useSheep } from '../contexts/SheepContext';
import PointsDisplay from '../components/PointsDisplay';
import AchievementModal from '../components/AchievementModal';
import StreakCelebration from '../components/StreakCelebration';
import { supabase, getCurrentUser } from '../services/supabase';
import { PointsCalculator, StreakCalculator, SheepEvolution } from '../utils/pointsCalculator';

const { width, height } = Dimensions.get('window');

const MorningSummaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentSession, settings } = useSleep();
  const { 
    sheepStage, 
    sheepMood, 
    totalPoints, 
    currentStreak,
    updateSheepMood 
  } = useSheep();
  
  const [lastSession, setLastSession] = useState<any>(null);
  const [pointsBreakdown, setPointsBreakdown] = useState<any>(null);
  const [streakInfo, setStreakInfo] = useState<any>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadMorningData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadMorningData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get the most recent sleep session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      if (sessionData) {
        setLastSession(sessionData);
        
        // Calculate points breakdown
        if (settings) {
          const breakdown = PointsCalculator.calculateSessionPoints(
            sessionData,
            settings,
            currentStreak,
            0 // phoneUsageMinutes
          );
          setPointsBreakdown(breakdown);
        }

        // Calculate streak info
        const streak = StreakCalculator.calculateStreak(
          sessionData.sleep_date,
          new Date().toISOString().split('T')[0],
          currentStreak
        );
        setStreakInfo(streak);

        // Check for streak milestone
        const milestone = StreakCalculator.checkStreakMilestone(
          streak.currentStreak,
          currentStreak
        );
        
        if (milestone) {
          setStreakMilestone(milestone);
          setShowStreakCelebration(true);
        }
      }

      // Update sheep mood based on performance
      updateSheepMoodBasedOnPerformance(sessionData);

    } catch (error) {
      console.error('Error loading morning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSheepMoodBasedOnPerformance = (session: any) => {
    if (!session) return;

    const points = session.points_earned || 0;
    const missedCheckIns = session.check_ins_missed || 0;
    const snoozeCount = session.snooze_count || 0;

    if (points >= 10 && missedCheckIns === 0 && snoozeCount === 0) {
      updateSheepMood('excited'); // Perfect night
    } else if (points >= 5 && missedCheckIns <= 1) {
      updateSheepMood('happy'); // Good night
    } else if (points > 0) {
      updateSheepMood('yawning'); // Okay night
    } else {
      updateSheepMood('sad'); // Poor night
    }
  };

  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good Morning! ☀️';
    } else if (hour < 17) {
      return 'Good Afternoon! 🌤️';
    } else {
      return 'Good Evening! 🌅';
    }
  };

  const getPerformanceMessage = () => {
    if (!pointsBreakdown) return '';

    const points = pointsBreakdown.totalPoints;
    
    if (points >= 15) {
      return 'Outstanding sleep! Your sheep is thrilled! 🌟';
    } else if (points >= 10) {
      return 'Great sleep! Your sheep is happy! 😊';
    } else if (points >= 5) {
      return 'Good sleep! Your sheep is content! 😌';
    } else if (points > 0) {
      return 'Decent sleep! Your sheep is okay! 😐';
    } else {
      return 'Your sheep is concerned about your sleep! 😟';
    }
  };

  const getSleepQuality = () => {
    if (!lastSession) return 'Unknown';
    
    const bedtime = new Date(lastSession.bedtime);
    const wakeTime = lastSession.wake_time ? new Date(lastSession.wake_time) : new Date();
    const duration = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60);
    
    if (duration >= 8) return 'Excellent';
    if (duration >= 7) return 'Good';
    if (duration >= 6) return 'Fair';
    return 'Poor';
  };

  const handleContinue = () => {
    navigation.navigate('Home' as never);
  };

  const handleViewDetails = () => {
    navigation.navigate('PointsBreakdown' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your morning summary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnimation,
              transform: [
                { translateY: slideAnimation },
                { scale: scaleAnimation }
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreetingMessage()}</Text>
            <Text style={styles.subtitle}>Here's how you slept last night</Text>
          </View>

          {/* Sheep Status */}
          <View style={styles.sheepContainer}>
            <Text style={styles.sheepEmoji}>
              {sheepStage === 'baby' ? '🐑' : 
               sheepStage === 'fluffy' ? '🐑✨' :
               sheepStage === 'dreamy' ? '🐑🌙' : '🐑👑'}
            </Text>
            <Text style={styles.sheepMessage}>{getPerformanceMessage()}</Text>
          </View>

          {/* Points Display */}
          <PointsDisplay
            totalPoints={totalPoints}
            currentStreak={currentStreak}
            sheepStage={sheepStage}
            pointsToNextStage={SheepEvolution.getPointsToNextStage(sheepStage, totalPoints)}
            breakdown={pointsBreakdown}
            streakInfo={streakInfo}
            showBreakdown={true}
            onPress={handleViewDetails}
          />

          {/* Sleep Stats */}
          {lastSession && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Sleep Statistics</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Sleep Duration</Text>
                <Text style={styles.statValue}>
                  {Math.round(
                    ((lastSession.wake_time ? new Date(lastSession.wake_time) : new Date()).getTime() - 
                     new Date(lastSession.bedtime).getTime()) / (1000 * 60 * 60)
                  )} hours
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Sleep Quality</Text>
                <Text style={styles.statValue}>{getSleepQuality()}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Bedtime</Text>
                <Text style={styles.statValue}>
                  {new Date(lastSession.bedtime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
              
              {lastSession.wake_time && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Wake Time</Text>
                  <Text style={styles.statValue}>
                    {new Date(lastSession.wake_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              )}
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Check-ins Missed</Text>
                <Text style={styles.statValue}>{lastSession.check_ins_missed || 0}</Text>
              </View>
              
              {lastSession.snooze_count > 0 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Snoozes</Text>
                  <Text style={styles.statValue}>{lastSession.snooze_count}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Continue to Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.secondaryButtonText}>View Detailed Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Morning Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Morning Routine Tips</Text>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>💧</Text>
              <Text style={styles.tipText}>Drink a glass of water to rehydrate</Text>
            </View>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>☀️</Text>
              <Text style={styles.tipText}>Get some sunlight to reset your circadian rhythm</Text>
            </View>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>🧘</Text>
              <Text style={styles.tipText}>Do some light stretching or meditation</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Achievement Modal */}
      <AchievementModal
        visible={showAchievement}
        achievement={currentAchievement}
        onClose={() => setShowAchievement(false)}
      />

      {/* Streak Celebration */}
      <StreakCelebration
        visible={showStreakCelebration}
        streakCount={currentStreak}
        milestone={streakMilestone || 0}
        onClose={() => setShowStreakCelebration(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B8A4E4',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  sheepContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sheepEmoji: {
    fontSize: 80,
    marginBottom: 15,
  },
  sheepMessage: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#9B7EDE',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  tipText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    flex: 1,
    lineHeight: 20,
  },
});

export default MorningSummaryScreen;