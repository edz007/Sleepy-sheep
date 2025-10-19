import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  Alert,
  Vibration,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSleep } from '../contexts/SleepContext';
import { useSheep } from '../contexts/SheepContext';
import { AlarmService } from '../services/alarmService';

const { width, height } = Dimensions.get('window');

const AlarmScreen: React.FC = () => {
  const navigation = useNavigation();
  const { endSleepSession, currentSession } = useSleep();
  const { sheepStage, sheepMood, updateSheepMood } = useSheep();
  
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [maxSnoozes] = useState(3);
  const [snoozeInterval] = useState(5); // minutes
  const [isAlarmActive, setIsAlarmActive] = useState(true);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start alarm sound
    AlarmService.playAlarmSound('default');
    
    // Start animations
    startAnimations();
    
    // Vibrate if supported
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate([0, 1000, 500, 1000], true);
    }

    // Auto-stop vibration after 30 seconds
    const vibrationTimer = setTimeout(() => {
      Vibration.cancel();
    }, 30000);

    return () => {
      clearTimeout(vibrationTimer);
      Vibration.cancel();
    };
  }, []);

  const startAnimations = () => {
    // Pulse animation
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();

    // Slide animation
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Fade animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  };

  const handleSnooze = async () => {
    if (snoozeCount >= maxSnoozes) {
      Alert.alert(
        'Max Snoozes Reached',
        'You\'ve reached the maximum number of snoozes. Time to wake up!',
        [{ text: 'Wake Up', onPress: handleWakeUp }]
      );
      return;
    }

    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);

    // Calculate snooze penalty
    const penalty = AlarmService.calculateSnoozePenalty(newSnoozeCount);
    
    Alert.alert(
      'Snooze Activated',
      `Alarm will ring again in ${snoozeInterval} minutes.\n\nPenalty: -${penalty} points`,
      [{ text: 'OK' }]
    );

    // Schedule snooze alarm
    await AlarmService.snoozeAlarm({
      wakeTime: '07:00', // This would come from settings
      soundId: 'default',
      snoozeEnabled: true,
      snoozeInterval,
      maxSnoozes,
      vibrationEnabled: true,
    });

    // Update sheep mood
    updateSheepMood('yawning');
  };

  const handleWakeUp = async () => {
    try {
      // Stop alarm
      await AlarmService.dismissAlarm();
      Vibration.cancel();
      
      // End sleep session
      await endSleepSession();
      
      // Update sheep mood
      updateSheepMood('happy');
      
      // Navigate to morning summary
      navigation.navigate('MorningSummary' as never);
    } catch (error) {
      console.error('Error waking up:', error);
    }
  };

  const getSheepEmoji = () => {
    const stageEmojis = {
      baby: '🐑',
      fluffy: '🐑✨',
      dreamy: '🐑🌙',
      cloud_guardian: '☁️👑',
    };
    
    const moodEmojis = {
      happy: '😊',
      sleeping: '😴',
      sad: '😢',
      excited: '🤩',
      yawning: '🥱',
    };

    return `${stageEmojis[sheepStage]} ${moodEmojis[sheepMood]}`;
  };

  const getWakeUpMessage = () => {
    const messages = [
      'Good morning! Your sheep is excited to see you!',
      'Rise and shine! Time to start a new day!',
      'Wake up! Your sheep has been waiting for you!',
      'Good morning! Ready for another great day?',
      'Time to wake up! Your sheep is ready to play!',
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const slideTransform = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background Animation */}
      <Animated.View 
        style={[
          styles.background,
          {
            opacity: fadeAnimation,
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      />

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ translateY: slideTransform }],
            opacity: fadeAnimation,
          },
        ]}
      >
        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Sheep Companion */}
        <View style={styles.sheepContainer}>
          <Animated.Text 
            style={[
              styles.sheepEmoji,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            {getSheepEmoji()}
          </Animated.Text>
          <Text style={styles.sheepMessage}>{getWakeUpMessage()}</Text>
        </View>

        {/* Snooze Counter */}
        {snoozeCount > 0 && (
          <View style={styles.snoozeCounter}>
            <Text style={styles.snoozeText}>
              Snoozes: {snoozeCount}/{maxSnoozes}
            </Text>
            <Text style={styles.penaltyText}>
              Penalty: -{AlarmService.calculateSnoozePenalty(snoozeCount)} points
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.snoozeButton,
              snoozeCount >= maxSnoozes && styles.disabledButton
            ]}
            onPress={handleSnooze}
            disabled={snoozeCount >= maxSnoozes}
          >
            <Text style={styles.buttonText}>
              Snooze ({snoozeInterval} min)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.wakeUpButton}
            onPress={handleWakeUp}
          >
            <Text style={styles.buttonText}>Wake Up</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Session Info */}
        {currentSession && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionText}>
              Sleep Duration: {Math.round(
                (new Date().getTime() - new Date(currentSession.bedtime).getTime()) / (1000 * 60 * 60)
              )} hours
            </Text>
            <Text style={styles.sessionText}>
              Check-ins Missed: {currentSession.check_ins_missed}
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Morning Tips:</Text>
          <Text style={styles.tipText}>• Drink a glass of water</Text>
          <Text style={styles.tipText}>• Do some light stretching</Text>
          <Text style={styles.tipText}>• Get some sunlight</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  dateText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 10,
  },
  sheepContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sheepEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  sheepMessage: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  snoozeCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    alignItems: 'center',
  },
  snoozeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  penaltyText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    marginBottom: 30,
  },
  snoozeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  wakeUpButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sessionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  sessionText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 3,
  },
});

export default AlarmScreen;
