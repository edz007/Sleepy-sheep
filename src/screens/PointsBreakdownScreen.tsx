import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { useSleep } from '../contexts/SleepContext';
import { useSheep } from '../contexts/SheepContext';
import PointsDisplay from '../components/PointsDisplay';
import { supabase, getCurrentUser } from '../services/supabase';
import { PointsBreakdown, StreakInfo } from '../utils/pointsCalculator';

const PointsBreakdownScreen: React.FC = () => {
  const { settings } = useSleep();
  const { totalPoints, currentStreak } = useSheep();
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

  useEffect(() => {
    loadRecentSessions();
  }, []);

  const loadRecentSessions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSessionBreakdown = (session: any): PointsBreakdown => {
    if (!settings) {
      return {
        bedtimePoints: 0,
        checkInPoints: 0,
        streakBonus: 0,
        phoneUsagePenalty: 0,
        snoozePenalty: 0,
        totalPoints: session.points_earned || 0,
      };
    }

    // This would use the actual PointsCalculator in a real implementation
    return {
      bedtimePoints: session.points_earned || 0,
      checkInPoints: 0,
      streakBonus: 0,
      phoneUsagePenalty: 0,
      snoozePenalty: 0,
      totalPoints: session.points_earned || 0,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPointsTrend = () => {
    if (recentSessions.length < 2) return 'stable';
    
    const lastWeek = recentSessions.slice(0, 7);
    const previousWeek = recentSessions.slice(7, 14);
    
    const lastWeekAvg = lastWeek.reduce((sum, session) => sum + (session.points_earned || 0), 0) / lastWeek.length;
    const previousWeekAvg = previousWeek.length > 0 
      ? previousWeek.reduce((sum, session) => sum + (session.points_earned || 0), 0) / previousWeek.length 
      : lastWeekAvg;
    
    if (lastWeekAvg > previousWeekAvg * 1.1) return 'up';
    if (lastWeekAvg < previousWeekAvg * 0.9) return 'down';
    return 'stable';
  };

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Points Breakdown</Text>
          <Text style={styles.subtitle}>Track your sleep progress</Text>
        </View>

        {/* Enhanced Points Display */}
        <PointsDisplay
          totalPoints={totalPoints}
          currentStreak={currentStreak}
          sheepStage="baby" // This would come from context
          pointsToNextStage={50 - (totalPoints % 50)}
          streakInfo={streakInfo}
        />

        {/* Trend Indicator */}
        <View style={styles.trendContainer}>
          <Text style={styles.trendEmoji}>{getTrendEmoji(getPointsTrend())}</Text>
          <Text style={styles.trendText}>
            Your sleep quality is trending {getPointsTrend()}
          </Text>
        </View>

        {/* Recent Sessions */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Recent Sleep Sessions</Text>
          
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sleep sessions yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your sleep to see your progress!</Text>
            </View>
          ) : (
            recentSessions.map((session, index) => {
              const breakdown = calculateSessionBreakdown(session);
              return (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.sleep_date)}
                    </Text>
                    <Text style={styles.sessionPoints}>
                      +{breakdown.totalPoints} pts
                    </Text>
                  </View>
                  
                  <View style={styles.sessionDetails}>
                    <Text style={styles.sessionTime}>
                      Bedtime: {new Date(session.bedtime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    {session.wake_time && (
                      <Text style={styles.sessionTime}>
                        Wake: {new Date(session.wake_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    )}
                    {session.check_ins_missed > 0 && (
                      <Text style={styles.sessionPenalty}>
                        Missed check-ins: {session.check_ins_missed}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Tips to Earn More Points</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>⏰</Text>
            <Text style={styles.tipTitle}>Sleep on Time</Text>
            <Text style={styles.tipDescription}>
              Go to bed within 15 minutes of your target bedtime for bonus points
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>✅</Text>
            <Text style={styles.tipTitle}>Complete Check-ins</Text>
            <Text style={styles.tipDescription}>
              Respond to sleep check-ins to avoid point penalties
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🔥</Text>
            <Text style={styles.tipTitle}>Build Streaks</Text>
            <Text style={styles.tipDescription}>
              Maintain consecutive days of good sleep for streak bonuses
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B8A4E4',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  trendContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  trendEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  trendText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  sessionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sessionDetails: {
    marginTop: 5,
  },
  sessionTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 2,
  },
  sessionPenalty: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 5,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    flex: 1,
  },
  tipDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    flex: 1,
    lineHeight: 18,
  },
});

export default PointsBreakdownScreen;
