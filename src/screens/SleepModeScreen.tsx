import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Animated,
  Dimensions 
} from 'react-native';
import { useSleep } from '../contexts/SleepContext';
import { useSheep } from '../contexts/SheepContext';

const { width, height } = Dimensions.get('window');

const SleepModeScreen: React.FC = () => {
  const { currentSession, checkIn, endSleepSession } = useSleep();
  const { sheepMood, updateSheepMood } = useSheep();
  const [checkInCount, setCheckInCount] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [breathingAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (showBreathingGuide) {
      startBreathingAnimation();
    }
  }, [showBreathingGuide]);

  const startBreathingAnimation = () => {
    const breathingCycle = () => {
      // Inhale (4 seconds)
      setBreathingPhase('inhale');
      Animated.timing(breathingAnimation, {
        toValue: 1.2,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        // Hold (7 seconds)
        setBreathingPhase('hold');
        Animated.timing(breathingAnimation, {
          toValue: 1.2,
          duration: 7000,
          useNativeDriver: true,
        }).start(() => {
          // Exhale (8 seconds)
          setBreathingPhase('exhale');
          Animated.timing(breathingAnimation, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }).start(() => {
            breathingCycle(); // Repeat
          });
        });
      });
    };
    breathingCycle();
  };

  const handleCheckIn = async () => {
    await checkIn();
    setCheckInCount(prev => prev + 1);
    updateSheepMood('happy');
    
    Alert.alert(
      'Check-in Complete!',
      'Great job staying awake! Your sheep is proud of you.',
      [{ text: 'OK' }]
    );
  };

  const handleFallingAsleep = () => {
    Alert.alert(
      'Sweet Dreams!',
      'Your sheep will watch over you. Tap "Wake Up" when you\'re ready to start your day.',
      [{ text: 'OK' }]
    );
    updateSheepMood('sleeping');
  };

  const handleWakeUp = () => {
    Alert.alert(
      'Wake Up',
      'Are you ready to end your sleep session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Wake Up', onPress: endSleepSession },
      ]
    );
  };

  const toggleBreathingGuide = () => {
    setShowBreathingGuide(!showBreathingGuide);
    if (!showBreathingGuide) {
      updateSheepMood('yawning');
    }
  };

  const getSheepEmoji = () => {
    const moodEmojis = {
      happy: '😊',
      sleeping: '😴',
      sad: '😢',
      excited: '🤩',
      yawning: '🥱',
    };
    return moodEmojis[sheepMood];
  };

  const getBreathingInstructions = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe in slowly...';
      case 'hold':
        return 'Hold your breath...';
      case 'exhale':
        return 'Breathe out slowly...';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sleep Mode</Text>
        <Text style={styles.subtitle}>Your sheep is here to help</Text>
      </View>

      {/* Sheep Companion */}
      <View style={styles.sheepContainer}>
        <Text style={styles.sheepEmoji}>{getSheepEmoji()}</Text>
        <Text style={styles.sheepMessage}>
          {sheepMood === 'sleeping' 
            ? 'Your sheep is sleeping peacefully...' 
            : 'I\'m here to help you sleep better!'}
        </Text>
      </View>

      {/* Breathing Guide */}
      {showBreathingGuide && (
        <View style={styles.breathingContainer}>
          <Text style={styles.breathingTitle}>4-7-8 Breathing Exercise</Text>
          <Animated.View 
            style={[
              styles.breathingCircle,
              { transform: [{ scale: breathingAnimation }] }
            ]}
          >
            <Text style={styles.breathingText}>{getBreathingInstructions()}</Text>
          </Animated.View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {sheepMood !== 'sleeping' && (
          <>
            <TouchableOpacity 
              style={styles.checkInButton}
              onPress={handleCheckIn}
            >
              <Text style={styles.buttonText}>I'm Still Awake</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sleepButton}
              onPress={handleFallingAsleep}
            >
              <Text style={styles.buttonText}>I'm Falling Asleep</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={styles.breathingButton}
          onPress={toggleBreathingGuide}
        >
          <Text style={styles.buttonText}>
            {showBreathingGuide ? 'Hide Breathing Guide' : 'Can\'t Sleep? Try Breathing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.wakeUpButton}
          onPress={handleWakeUp}
        >
          <Text style={styles.buttonText}>Wake Up</Text>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      {currentSession && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            Check-ins completed: {checkInCount}
          </Text>
          <Text style={styles.sessionText}>
            Sleep started: {new Date(currentSession.bedtime).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Sleep Tips:</Text>
        <Text style={styles.tipText}>• Keep your phone away from your bed</Text>
        <Text style={styles.tipText}>• Try the breathing exercise if you can't sleep</Text>
        <Text style={styles.tipText}>• Check in regularly to earn points</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C1810',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
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
  sheepContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sheepEmoji: {
    fontSize: 80,
    marginBottom: 15,
  },
  sheepMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  breathingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  breathingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  breathingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionContainer: {
    marginBottom: 30,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  sleepButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  breathingButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  wakeUpButton: {
    backgroundColor: '#F44336',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sessionText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.8,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.8,
  },
});

export default SleepModeScreen;