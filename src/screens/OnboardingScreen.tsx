import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { useSleep } from '../contexts/SleepContext';
import { useSheep } from '../contexts/SheepContext';
import ErrorHandler from '../utils/errorHandler';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { updateSettings } = useSleep();
  const { addPoints } = useSheep();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [checkInInterval, setCheckInInterval] = useState(15);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to SleepySheep! 🐑',
      description: 'Your adorable sleep companion is here to help you build better sleep habits.',
      component: (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>🌟</Text>
          <Text style={styles.stepDescription}>
            SleepySheep will track your sleep, reward good habits, and help you build a consistent routine.
          </Text>
          <Text style={styles.stepDescription}>
            Your sheep will evolve as you improve your sleep habits!
          </Text>
        </View>
      ),
    },
    {
      id: 'bedtime',
      title: 'Set Your Bedtime 🌙',
      description: 'When do you usually go to sleep?',
      component: (
        <View style={styles.stepContent}>
          <TextInput
            style={styles.timeInput}
            value={bedtime}
            onChangeText={setBedtime}
            placeholder="HH:MM"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          <Text style={styles.inputHint}>
            Enter your target bedtime in 24-hour format
          </Text>
        </View>
      ),
    },
    {
      id: 'wakeTime',
      title: 'Set Your Wake Time ☀️',
      description: 'When do you want to wake up?',
      component: (
        <View style={styles.stepContent}>
          <TextInput
            style={styles.timeInput}
            value={wakeTime}
            onChangeText={setWakeTime}
            placeholder="HH:MM"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          <Text style={styles.inputHint}>
            Enter your target wake time in 24-hour format
          </Text>
        </View>
      ),
    },
    {
      id: 'checkIns',
      title: 'Sleep Check-ins 📱',
      description: 'How often should we check if you\'re still awake?',
      component: (
        <View style={styles.stepContent}>
          <View style={styles.intervalOptions}>
            {[5, 10, 15, 20, 30].map(interval => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalOption,
                  checkInInterval === interval && styles.intervalOptionSelected
                ]}
                onPress={() => setCheckInInterval(interval)}
              >
                <Text style={[
                  styles.intervalOptionText,
                  checkInInterval === interval && styles.intervalOptionTextSelected
                ]}>
                  {interval} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputHint}>
            We'll gently check if you're still awake during this interval
          </Text>
        </View>
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications 🔔',
      description: 'Enable notifications for bedtime reminders and wake-up alarms?',
      component: (
        <View style={styles.stepContent}>
          <TouchableOpacity
            style={[
              styles.toggleSwitch,
              notificationsEnabled && styles.toggleSwitchActive
            ]}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.toggleLabel,
              styles.toggleLabelOff,
              notificationsEnabled && styles.toggleLabelOffInactive
            ]}>
              OFF
            </Text>
            <View style={[
              styles.toggleIndicator,
              notificationsEnabled && styles.toggleIndicatorActive
            ]} />
            <Text style={[
              styles.toggleLabel,
              styles.toggleLabelOn,
              !notificationsEnabled && styles.toggleLabelOnInactive
            ]}>
              ON
            </Text>
          </TouchableOpacity>
          <Text style={styles.inputHint}>
            You can change this later in settings
          </Text>
        </View>
      ),
    },
    {
      id: 'scoring',
      title: 'How Points Work 📊',
      description: 'Understanding the scoring system',
      component: (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>⭐</Text>
          <Text style={styles.stepDescription}>
            Here's how you earn and lose points:
          </Text>
          <Text style={[styles.stepDescription, { fontSize: 14, fontStyle: 'italic', marginTop: 10 }]}>
            💡 Tip: Penalties are calculated when you take actions, not continuously.
          </Text>
          <View style={styles.scoringList}>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringEmoji}>💤</Text>
              <View style={styles.scoringText}>
                <Text style={styles.scoringTitle}>Sleep Points</Text>
                <Text style={styles.scoringDescription}>+1 point per second of sleep</Text>
              </View>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringEmoji}>⏰</Text>
              <View style={styles.scoringText}>
                <Text style={styles.scoringTitle}>Late Bedtime</Text>
                <Text style={styles.scoringDescription}>-1 point per 2 seconds late (calculated when you sleep)</Text>
              </View>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringEmoji}>🔔</Text>
              <View style={styles.scoringText}>
                <Text style={styles.scoringTitle}>Late Wake-up</Text>
                <Text style={styles.scoringDescription}>-1 point per 5 seconds late (after 1 min grace, from alarm time)</Text>
              </View>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringEmoji}>🐑</Text>
              <View style={styles.scoringText}>
                <Text style={styles.scoringTitle}>Petting</Text>
                <Text style={styles.scoringDescription}>+1 point per pet</Text>
              </View>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringEmoji}>💀</Text>
              <View style={styles.scoringText}>
                <Text style={styles.scoringTitle}>Death</Text>
                <Text style={styles.scoringDescription}>Sheep dies at -200 points, resets to Level 1 with 10 points</Text>
              </View>
            </View>
            <View style={styles.scoringItem}>
              <Text style={styles.scoringEmoji}>⏱️</Text>
              <View style={styles.scoringText}>
                <Text style={styles.scoringTitle}>Bedtime Cooldown</Text>
                <Text style={styles.scoringDescription}>15-minute wait after waking before next bedtime reminder</Text>
              </View>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Your sheep is excited to help you sleep better!',
      component: (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>🐑✨</Text>
          <Text style={styles.stepDescription}>
            Your sleep journey starts now! Remember to:
          </Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Go to bed at {bedtime}</Text>
            <Text style={styles.tipItem}>• Wake up at {wakeTime}</Text>
            <Text style={styles.tipItem}>• Pet your sheep daily for bonus points</Text>
            <Text style={styles.tipItem}>• Build consistent sleep habits</Text>
          </View>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Validate current step
      if (validateCurrentStep()) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        animateToNextStep();
      }
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      animateToPreviousStep();
    }
  };

  const validateCurrentStep = (): boolean => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'bedtime':
        const bedtimeError = ErrorHandler.validateBedtime(bedtime);
        if (bedtimeError) {
          if (Platform.OS === 'web') {
            console.error('Invalid Bedtime:', bedtimeError.message);
          } else {
            Alert.alert('Invalid Bedtime', bedtimeError.message);
          }
          return false;
        }
        break;
      case 'wakeTime':
        const wakeTimeError = ErrorHandler.validateWakeTime(wakeTime);
        if (wakeTimeError) {
          if (Platform.OS === 'web') {
            console.error('Invalid Wake Time:', wakeTimeError.message);
          } else {
            Alert.alert('Invalid Wake Time', wakeTimeError.message);
          }
          return false;
        }
        break;
    }
    
    return true;
  };

  const animateToNextStep = () => {
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: -(currentStep + 1) * width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCurrentStep(prev => prev + 1);
    });
  };

  const animateToPreviousStep = () => {
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: -(currentStep - 1) * width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCurrentStep(prev => prev - 1);
    });
  };

  const completeOnboarding = async () => {
    try {
      // Save settings
      await updateSettings({
        bedtime_target: bedtime,
        wake_time_target: wakeTime,
        check_in_interval: checkInInterval,
        notification_enabled: notificationsEnabled,
      });

      // Award onboarding points
      addPoints(10);

      // Complete onboarding
      onComplete();
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to complete onboarding');
    }
  };

  const skipOnboarding = () => {
    // For web compatibility, skip directly without alert
    if (Platform.OS === 'web') {
      onComplete();
      return;
    }
    
    Alert.alert(
      'Skip Onboarding',
      'Are you sure you want to skip? You can set up your preferences later in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onComplete },
      ]
    );
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {steps.length}
        </Text>
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Step Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: fadeAnimation }
        ]}
      >
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        
        <View style={styles.stepComponentContainer}>
          {currentStepData.component}
        </View>
      </Animated.View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[
            styles.navButton,
            isFirstStep && styles.navButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={isFirstStep}
        >
          <Text style={[
            styles.navButtonText,
            isFirstStep && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.navButton,
            styles.navButtonPrimary
          ]}
          onPress={handleNext}
        >
          <Text style={[
            styles.navButtonText,
            styles.navButtonTextPrimary
          ]}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepIndicators}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepIndicator,
              index === currentStep && styles.stepIndicatorActive,
              completedSteps.has(index) && styles.stepIndicatorCompleted
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
    paddingTop: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  stepDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 30,
    lineHeight: 24,
  },
  stepComponentContainer: {
    alignItems: 'center',
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  stepEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  timeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    width: 150,
  },
  inputHint: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 10,
  },
  intervalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  intervalOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    margin: 5,
  },
  intervalOptionSelected: {
    backgroundColor: '#fff',
  },
  intervalOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  intervalOptionTextSelected: {
    color: '#B8A4E4',
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginBottom: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  toggleSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E74C3C', // Red for OFF
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 120,
    height: 50,
    marginBottom: 20,
    position: 'relative',
  },
  toggleSwitchActive: {
    backgroundColor: '#4CAF50', // Green for ON
  },
  toggleIndicator: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    left: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleIndicatorActive: {
    left: 76, // Moves to right side
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  toggleLabelOff: {
    color: '#fff',
  },
  toggleLabelOffInactive: {
    opacity: 0.3,
  },
  toggleLabelOn: {
    color: '#fff',
  },
  toggleLabelOnInactive: {
    opacity: 0.3,
  },
  tipsList: {
    alignItems: 'flex-start',
    marginTop: 20,
  },
  tipItem: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    opacity: 0.9,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#9B7EDE',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    opacity: 0.5,
  },
  navButtonTextPrimary: {
    color: '#fff',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  stepIndicatorActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#4CAF50',
  },
  scoringList: {
    width: '100%',
    marginTop: 20,
  },
  scoringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scoringEmoji: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  scoringText: {
    flex: 1,
  },
  scoringTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scoringDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    lineHeight: 18,
  },
});

export default OnboardingScreen;