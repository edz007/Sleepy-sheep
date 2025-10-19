import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSleep } from '../contexts/SleepContext';
import { useSheep } from '../contexts/SheepContext';
import SheepCharacter from '../components/SheepCharacter';
import SheepAccessories from '../components/SheepAccessories';
import SheepCelebration from '../components/SheepCelebration';
import { SheepEvolution as SheepEvolutionUtils } from '../utils/pointsCalculator';
import { TimezoneUtils } from '../utils/timezoneUtils';
// import { BedtimeReminderService } from '../services/bedtimeReminderService';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    startSleepSession, 
    endSleepSession, 
    isSleepMode, 
    currentSession, 
    settings, 
    loading 
  } = useSleep();
  const { 
    sheepStage, 
    sheepMood, 
    totalPoints, 
    currentStreak,
    addPoints 
  } = useSheep();

  // Cooldown period after waking up before bedtime reminders resume (in minutes)
  const BEDTIME_REMINDER_COOLDOWN_MINUTES = 10 / 60; // 10 seconds for testing

  // State for modals and celebrations
  const [showAccessories, setShowAccessories] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'achievement' | 'streak' | 'evolution' | 'points' | 'petting'>('petting');
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [bedtimeInterval, setBedtimeInterval] = useState<NodeJS.Timeout | null>(null);
  const [wakeUpInterval, setWakeUpInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastWakeUpTime, setLastWakeUpTime] = useState<Date | null>(null);
  const [wakeUpAlarmFiredAt, setWakeUpAlarmFiredAt] = useState<Date | null>(null);

  // State for wake-up summary modal
  const [showWakeUpSummary, setShowWakeUpSummary] = useState(false);
  const [wakeUpSummaryData, setWakeUpSummaryData] = useState<{
    sleepPoints: number;
    wakeUpPenalty: number;
    totalPoints: number;
  } | null>(null);

  // Ref to track current bedtime interval for cleanup
  const bedtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to check if bedtime reminder can be shown
  const canShowBedtimeReminder = useCallback(() => {
    return TimezoneUtils.hasMinutesPassed(lastWakeUpTime, BEDTIME_REMINDER_COOLDOWN_MINUTES);
  }, [lastWakeUpTime]);

  // Smart bedtime monitoring with precise timing
  useEffect(() => {
    // Clear any existing intervals first - use ref for reliable cleanup
    if (bedtimeIntervalRef.current) {
      console.log('🧹 Clearing existing bedtime monitoring (ref)');
      clearInterval(bedtimeIntervalRef.current);
      clearTimeout(bedtimeIntervalRef.current as any);
      bedtimeIntervalRef.current = null;
    }
    if (bedtimeInterval) {
      console.log('🧹 Clearing existing bedtime monitoring (state)');
      clearInterval(bedtimeInterval);
      clearTimeout(bedtimeInterval as any);
      setBedtimeInterval(null);
    }
    
    // Don't start bedtime monitoring if already in sleep mode
    if (isSleepMode) {
      console.log('💤 Already in sleep mode, skipping bedtime monitoring');
      return;
    }
    
    if (settings?.bedtime_target && settings?.notification_enabled) {
      console.log('Starting smart bedtime monitoring for:', settings.bedtime_target);
      
      const checkBedtime = () => {
        // Check cooldown first
        if (!canShowBedtimeReminder()) {
          console.log('⏸️ Bedtime reminder on cooldown');
          return;
        }
        
        const now = new Date();
        const bedtime = TimezoneUtils.getTodayOccurrence(settings.bedtime_target);
        let wakeTime = TimezoneUtils.getTodayOccurrence(settings.wake_time_target);
        
        // Handle cross-midnight: if wake time is before bedtime, it's next day
        if (wakeTime < bedtime) {
          wakeTime.setDate(wakeTime.getDate() + 1);
        }
        
        console.log('Bedtime check:', {
          currentTime: now.toLocaleTimeString(),
          bedtime: bedtime.toLocaleTimeString(),
          wakeTime: wakeTime.toLocaleTimeString(),
          isSleepMode: isSleepMode,
          canShowReminder: canShowBedtimeReminder()
        });
        
        // Stop if we've reached wake time (skip sleep scenario)
        if (now >= wakeTime) {
          console.log('⏰ Wake time reached, stopping bedtime reminders');
          if (bedtimeInterval) {
            clearInterval(bedtimeInterval);
            setBedtimeInterval(null);
          }
          return;
        }
        
        // Show reminder if at/past bedtime and not sleeping
        if (now >= bedtime && !isSleepMode) {
          console.log('🎉 Bedtime reached!');
          
          // Show reminder with potential penalty (not deducted yet)
          let reminderMessage = `🌙 Bedtime Reminder!\n\nIt's time to start your sleep routine! Your sheep is getting sleepy.`;
          
          if (now > bedtime) {
            const lateSeconds = Math.floor((now.getTime() - bedtime.getTime()) / 1000);
            const potentialPenalty = Math.floor(lateSeconds / 2);
            
            if (potentialPenalty > 0) {
              console.log(`⏰ Potential late bedtime penalty: -${potentialPenalty} points (${lateSeconds} seconds late)`);
              reminderMessage += `\n\n⏰ You're ${lateSeconds} seconds late.\nPotential penalty: -${potentialPenalty} points`;
            }
          }
          
          // Show reminder (no penalty deduction here!)
          alert(reminderMessage);
          
          // DON'T stop monitoring - continue reminding!
        }
      };
      
      // Smart scheduling: First check at bedtime, then regular intervals
      const now = new Date();
      const bedtime = TimezoneUtils.getTodayOccurrence(settings.bedtime_target);
      const intervalMs = (settings.check_in_interval || 30) * 60 * 1000;
      
      if (now < bedtime) {
        // Before bedtime: Schedule first check exactly at bedtime
        const msUntilBedtime = bedtime.getTime() - now.getTime();
        console.log(`⏰ Scheduling first bedtime check in ${Math.round(msUntilBedtime / 1000)} seconds`);
        
        const bedtimeTimeout = setTimeout(() => {
          console.log('🎯 First bedtime check triggered at exact bedtime');
          checkBedtime(); // First check at bedtime
          
          // Start regular interval AFTER first reminder
          const interval = setInterval(checkBedtime, intervalMs);
          bedtimeIntervalRef.current = interval;
          setBedtimeInterval(interval);
        }, msUntilBedtime);
        
        // Store timeout so we can clear it
        bedtimeIntervalRef.current = bedtimeTimeout as any;
        setBedtimeInterval(bedtimeTimeout as any);
      } else {
        // Already past bedtime: Start immediately
        console.log('⏰ Already past bedtime, starting reminders immediately');
        checkBedtime(); // Immediate check
        const interval = setInterval(checkBedtime, intervalMs);
        bedtimeIntervalRef.current = interval;
        setBedtimeInterval(interval);
      }
      
      return () => {
        console.log('🧹 Cleanup: Clearing bedtime monitoring');
        if (bedtimeIntervalRef.current) {
          clearInterval(bedtimeIntervalRef.current);
          clearTimeout(bedtimeIntervalRef.current as any);
          bedtimeIntervalRef.current = null;
        }
        if (bedtimeInterval) {
          clearInterval(bedtimeInterval);
          clearTimeout(bedtimeInterval as any);
        }
      };
    }
  }, [settings?.bedtime_target, settings?.notification_enabled, settings?.check_in_interval, isSleepMode, lastWakeUpTime]);

  // Helper function to calculate sleep points
  const calculateSleepPoints = () => {
    if (!currentSession || !settings?.wake_time_target) return 0;
    
    const bedtime = new Date(currentSession.bedtime);
    let wakeTimeTarget = TimezoneUtils.getTodayOccurrence(settings.wake_time_target);
    const now = new Date();
    
    // Handle cross-midnight: if wake time is before bedtime, it's next day
    if (wakeTimeTarget < bedtime) {
      wakeTimeTarget.setDate(wakeTimeTarget.getDate() + 1);
    }
    
    // Calculate scheduled sleep duration (bedtime to wake time target)
    const scheduledSleepSeconds = (wakeTimeTarget.getTime() - bedtime.getTime()) / 1000;
    
    // Calculate actual sleep duration (bedtime to actual wake)
    const actualSleepSeconds = (now.getTime() - bedtime.getTime()) / 1000;
    
    // Award points only up to scheduled wake time (cap at scheduled)
    // Also ensure non-negative
    const earnedSleepSeconds = Math.max(0, Math.min(actualSleepSeconds, scheduledSleepSeconds));
    
    return Math.floor(earnedSleepSeconds);
  };

  // Helper function to calculate wake-up penalty (returns negative value)
  const calculateWakeUpPenalty = (alarmTime: Date) => {
    const now = new Date();
    const lateSeconds = Math.floor((now.getTime() - alarmTime.getTime()) / 1000);
    
    // Only apply penalty after 1 minute grace period
    if (lateSeconds > 60) {
      const penaltySeconds = lateSeconds - 60; // Subtract grace period
      return -Math.floor(penaltySeconds / 5); // Negative penalty: 1 point per 5 seconds
    }
    
    return 0;
  };

  // Wake-up alarm monitoring with penalty
  useEffect(() => {
    if (settings?.wake_time_target && settings?.notification_enabled && isSleepMode) {
      console.log('Starting wake-up monitoring for:', settings.wake_time_target);
      
      const checkWakeUp = () => {
        const now = new Date();
        const targetTime = TimezoneUtils.getNextOccurrence(settings.wake_time_target);
        
        console.log('Wake-up check:', {
          currentTime: now.toLocaleTimeString(),
          targetTime: targetTime.toLocaleTimeString(),
          isSleepMode: isSleepMode
        });
        
        // Trigger wake-up alarm (at or past wake-up time)
        if (now >= targetTime) {
          console.log('🔔 Wake-up time reached!');
          
          // Track when alarm fired for penalty calculation
          if (!wakeUpAlarmFiredAt) {
            setWakeUpAlarmFiredAt(now);
          }
          
          // Show simple wake-up alarm (no points calculated yet)
          alert('🔔 Wake Up Alarm!\n\nGood morning! Time to start your day! Your sheep is ready to play!');
          
          // Stop wake-up monitoring after triggering (no more notifications)
          if (wakeUpInterval) {
            clearInterval(wakeUpInterval);
            setWakeUpInterval(null);
          }
        }
      };
      
      // Check at the same interval as check-in interval setting
      const intervalMs = (settings.check_in_interval || 30) * 60 * 1000;
      const interval = setInterval(checkWakeUp, intervalMs);
      setWakeUpInterval(interval);
      
      // Also check immediately
      checkWakeUp();
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [settings?.wake_time_target, settings?.notification_enabled, settings?.check_in_interval, isSleepMode]);

  // Consolidated sleep cycle state management
  useEffect(() => {
    if (!isSleepMode) {
      // Waking up: Set wake-up time and clear intervals
      setLastWakeUpTime(new Date());
      if (wakeUpInterval) {
        clearInterval(wakeUpInterval);
        setWakeUpInterval(null);
      }
      // Note: Don't clear bedtimeInterval - new monitoring will start automatically
    } else {
      // Starting sleep: Clear wake alarm state
      setWakeUpAlarmFiredAt(null);
    }
  }, [isSleepMode]);

  const handleSleepButtonPress = async () => {
    console.log('handleSleepButtonPress called, isSleepMode:', isSleepMode);
    
    if (isSleepMode) {
      console.log('Directly calling endSleepSession (skipping alert for web)');
      
      // Calculate and show sleep summary before ending session
      if (settings?.wake_time_target && wakeUpAlarmFiredAt && currentSession) {
        const sleepPoints = calculateSleepPoints();
        const wakeUpPenalty = calculateWakeUpPenalty(wakeUpAlarmFiredAt);
        const totalPoints = sleepPoints + wakeUpPenalty; // Add penalty (which is negative)
        
        console.log('Wake-up calculation:', {
          sleepPoints,
          wakeUpPenalty,
          totalPoints,
          currentSession: !!currentSession,
          wakeUpAlarmFiredAt: wakeUpAlarmFiredAt.toLocaleTimeString()
        });
        
        // Store summary data and show modal
        setWakeUpSummaryData({
          sleepPoints,
          wakeUpPenalty,
          totalPoints
        });
        setShowWakeUpSummary(true);
        
        // Apply total points to sheep
        if (totalPoints !== 0) {
          addPoints(totalPoints);
        }
      } else {
        console.log('Missing data for wake-up calculation:', {
          hasWakeTime: !!settings?.wake_time_target,
          hasAlarmFired: !!wakeUpAlarmFiredAt,
          hasCurrentSession: !!currentSession
        });
      }
      
      await endSleepSession();
    } else {
      // Starting sleep: Calculate and apply bedtime penalty NOW
      if (settings?.bedtime_target) {
        const now = new Date();
        const bedtime = TimezoneUtils.getTodayOccurrence(settings.bedtime_target);
        
        if (now > bedtime) {
          const lateSeconds = Math.floor((now.getTime() - bedtime.getTime()) / 1000);
          const penalty = Math.floor(lateSeconds / 2);
          
          if (penalty > 0) {
            console.log(`💤 Applying late bedtime penalty: -${penalty} points`);
            addPoints(-penalty);
            
            alert(`💤 Starting sleep session...\n\n⏰ Late Bedtime Penalty Applied!\nYou were ${lateSeconds} seconds late.\n-${penalty} points deducted.`);
          }
        }
      }
      
      console.log('Starting sleep session');
      await startSleepSession();
    }
  };

  const getDeathWarning = () => {
    if (totalPoints <= -150) {
      return '💀 CRITICAL: Sheep is dying!';
    } else if (totalPoints <= -100) {
      return '⚠️ WARNING: Sheep is very sick!';
    } else if (totalPoints <= -50) {
      return '😰 CAUTION: Sheep is getting sick!';
    }
    return null;
  };

  const pointsToNextStage = SheepEvolutionUtils.getPointsToNextStage(sheepStage, totalPoints);

  // Handle sheep petting
  const handleSheepPet = async () => {
    // Add 1 point for petting
    await addPoints(1);
    
    setCelebrationType('petting');
    setCelebrationMessage('Your sheep loves the attention! +1 point! 💕');
    setShowCelebration(true);
  };

  // Handle sheep tap
  const handleSheepTap = async () => {
    // Add 1 point for tapping
    await addPoints(1);
    
    setCelebrationType('petting');
    setCelebrationMessage('Your sheep is happy to see you! +1 point! 😊');
    setShowCelebration(true);
  };

  const getBedtimeStatus = () => {
    if (!settings) return 'Set your bedtime in settings';
    
    return TimezoneUtils.getBedtimeStatus(settings.bedtime_target);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading SleepySheep...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
        <Text style={styles.title}>SleepySheep</Text>
        <Text style={styles.subtitle}>Your Sleep Companion</Text>
      </View>

      {/* Interactive Sheep Character */}
      <View style={styles.sheepContainer}>
        <SheepCharacter
          size="large"
          interactive={true}
          showAccessories={true}
          onPet={handleSheepPet}
          onTap={handleSheepTap}
          isSleepMode={isSleepMode}
        />
        
        {/* Accessories Button */}
            <TouchableOpacity
          style={styles.accessoriesButton}
          onPress={() => setShowAccessories(true)}
            >
          <Text style={styles.accessoriesButtonText}>🎭 Accessories</Text>
            </TouchableOpacity>
          </View>

      {/* Combined Sleep Info Box */}
      {settings && (
        <View style={styles.sleepInfoContainer}>
          {/* Wake Time - Left */}
          <View style={styles.sleepInfoSection}>
            <Text style={styles.sleepInfoEmoji}>☀️</Text>
            <Text style={styles.sleepInfoLabel}>Wake</Text>
            <Text style={styles.sleepInfoTime}>{settings.wake_time_target}</Text>
          </View>

          {/* Level - Middle */}
          <View style={styles.sleepInfoSection}>
            <Text style={styles.sleepInfoEmoji}>⭐</Text>
            <Text style={styles.sleepInfoLabel}>Level</Text>
            <Text style={styles.sleepInfoTime}>{SheepEvolutionUtils.getLevelNumber(sheepStage)}</Text>
          </View>

          {/* Bedtime - Right */}
          <View style={styles.sleepInfoSection}>
            <Text style={styles.sleepInfoEmoji}>🌙</Text>
            <Text style={styles.sleepInfoLabel}>Bedtime</Text>
            <Text style={styles.sleepInfoTime}>{settings.bedtime_target}</Text>
          </View>
        </View>
      )}

      {/* Death Warning */}
      {getDeathWarning() && (
        <View style={styles.deathWarningContainer}>
          <Text style={styles.deathWarningText}>{getDeathWarning()}</Text>
          <Text style={styles.deathWarningSubtext}>
            Points: {totalPoints} (Death at -200)
          </Text>
        </View>
      )}

      {/* Simple Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
          </View>

      {/* Evolution Progress */}
      <View style={styles.evolutionProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${Math.min((totalPoints / (totalPoints + pointsToNextStage)) * 100, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {pointsToNextStage} points to next evolution
            </Text>
          </View>

      {/* MAIN SLEEP BUTTON - This should be visible */}
      <TouchableOpacity 
        style={styles.sleepButton}
        onPress={handleSleepButtonPress}
      >
        <Text style={styles.buttonText}>
          {isSleepMode ? 'Wake Up & Earn Points!' : "I'm Going to Sleep"}
        </Text>
      </TouchableOpacity>

      {/* SECONDARY BUTTONS - These should be visible */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.secondaryButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Relaxation' as never)}
        >
          <Text style={styles.secondaryButtonText}>😴 Can't Sleep?</Text>
        </TouchableOpacity>
      </View>


      {/* Modals */}
      <SheepAccessories
        visible={showAccessories}
        onClose={() => setShowAccessories(false)}
      />

      <SheepCelebration
        visible={showCelebration}
        type={celebrationType}
        message={celebrationMessage}
        sheepStage={sheepStage}
        sheepMood={sheepMood}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Wake-up Summary Modal */}
      {showWakeUpSummary && wakeUpSummaryData && (
        <View style={styles.modalOverlay}>
          <View style={styles.wakeUpSummaryModal}>
            <Text style={styles.modalTitle}>🔔 Wake Up Summary!</Text>
            <Text style={styles.modalSubtitle}>Good morning! Time to start your day!</Text>
            
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>📊 Sleep Summary:</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sleep points earned:</Text>
                <Text style={styles.summaryValue}>+{wakeUpSummaryData.sleepPoints}</Text>
              </View>
              
              {wakeUpSummaryData.wakeUpPenalty < 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Late wake-up penalty:</Text>
                  <Text style={styles.penaltyValue}>{wakeUpSummaryData.wakeUpPenalty}</Text>
                </View>
              )}
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total points:</Text>
                <Text style={[
                  styles.totalValue,
                  wakeUpSummaryData.totalPoints >= 0 ? styles.positiveValue : styles.negativeValue
                ]}>
                  {wakeUpSummaryData.totalPoints >= 0 ? '+' : ''}{wakeUpSummaryData.totalPoints}
                </Text>
              </View>
            </View>
            
            <Text style={styles.modalFooter}>Your sheep is ready to play! 🐑✨</Text>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWakeUpSummary(false)}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  sheepContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  accessoriesButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 15,
  },
  accessoriesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
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
  },
  evolutionProgress: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9B7EDE',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  sleepButton: {
    backgroundColor: '#9B7EDE',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sleepInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sleepInfoSection: {
    alignItems: 'center',
    flex: 1,
  },
  sleepInfoEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  sleepInfoLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 2,
  },
  sleepInfoTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deathWarningContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deathWarningText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  deathWarningSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  // Wake-up Summary Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  wakeUpSummaryModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    maxWidth: 350,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  penaltyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#28a745',
  },
  negativeValue: {
    color: '#dc3545',
  },
  modalFooter: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#B8A4E4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;