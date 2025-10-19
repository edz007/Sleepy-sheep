import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSleep } from '../contexts/SleepContext';
import SleepCoachChat from '../components/SleepCoachChat';
import GuidedExerciseModal from '../components/GuidedExerciseModal';
import ExercisePlayer from '../components/ExercisePlayer';
import { VoiceSettings } from '../services/elevenLabsService';
import { Audio } from 'expo-av';

// Import local audio files
const rainSound = require('../assets/sounds/rain.mp3');
const oceanSound = require('../assets/sounds/ocean.mp3');
const forestSound = require('../assets/sounds/forest.mp3');

const RelaxationModal: React.FC = () => {
  const navigation = useNavigation();
  const { startSleepSession, isSleepMode } = useSleep();
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [showSleepCoach, setShowSleepCoach] = useState(false);
  const [showGuidedExercises, setShowGuidedExercises] = useState(false);
  const [showExercisePlayer, setShowExercisePlayer] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<{id: string, voiceSettings: VoiceSettings} | null>(null);
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null);

  const relaxationSounds = [
    { id: 'rain', name: 'Rain', emoji: '🌧️', url: rainSound },
    { id: 'forest', name: 'Forest', emoji: '🌲', url: forestSound },
    { id: 'waves', name: 'Ocean Waves', emoji: '🌊', url: oceanSound },
  ];

  const sleepyIdeas = [
    {
      title: '4-7-8 Breathing Technique',
      emoji: '🫁',
      description: 'A simple breathing exercise to calm your nervous system',
      details: 'Inhale for 4 counts, hold for 7 counts, exhale for 8 counts. Repeat 4 times. This activates your parasympathetic nervous system and helps reduce stress.',
      steps: ['Sit or lie comfortably', 'Place tongue tip behind upper teeth', 'Exhale completely through mouth', 'Close mouth, inhale through nose for 4 counts', 'Hold breath for 7 counts', 'Exhale through mouth for 8 counts', 'Repeat 3 more times']
    },
    {
      title: 'Counting Sheep',
      emoji: '🐑',
      description: 'Classic technique to distract your mind',
      details: 'Counting helps focus your mind away from worries and racing thoughts. Try counting backwards from 100 or counting sheep jumping over a fence.',
      steps: ['Get comfortable in bed', 'Close your eyes', 'Start counting backwards from 100', 'If you lose track, start over', 'Focus only on the numbers', 'Let sleep come naturally']
    },
    {
      title: 'Progressive Muscle Relaxation',
      emoji: '🧘',
      description: 'Systematically tense and relax muscle groups',
      details: 'This technique helps release physical tension and promotes relaxation throughout your body.',
      steps: ['Start with your toes', 'Tense for 5 seconds, then relax', 'Move up to calves, thighs, abdomen', 'Continue to arms, shoulders, neck', 'Finish with facial muscles', 'Notice the contrast between tension and relaxation']
    },
    {
      title: 'Visualization',
      emoji: '🌅',
      description: 'Create a peaceful mental scene',
      details: 'Imagining a calm, peaceful place can help your mind and body relax. Choose somewhere you feel safe and comfortable.',
      steps: ['Choose a peaceful place (beach, forest, meadow)', 'Close your eyes and imagine being there', 'Use all your senses - what do you see, hear, smell?', 'Feel the warmth, breeze, or textures', 'Stay in this place until you feel relaxed', 'Let sleep come naturally']
    },
    {
      title: 'Gentle Stretching',
      emoji: '🤸',
      description: 'Release physical tension before bed',
      details: 'Light stretching can help release muscle tension and prepare your body for sleep. Keep movements slow and gentle.',
      steps: ['Neck rolls - slowly roll head in circles', 'Shoulder shrugs - lift and lower shoulders', 'Spinal twist - gentle torso rotation', 'Leg stretches - gentle hamstring stretches', 'Deep breathing during each stretch', 'Finish with relaxation pose']
    },
    {
      title: 'Journal Writing',
      emoji: '📝',
      description: 'Clear your mind by writing down thoughts',
      details: 'Writing down worries, thoughts, or gratitude can help clear your mind and reduce racing thoughts that keep you awake.',
      steps: ['Keep a journal by your bed', 'Write down any worries or thoughts', 'List 3 things you\'re grateful for', 'Write about your day briefly', 'Don\'t worry about grammar or style', 'Close the journal and let go of thoughts']
    }
  ];

  // Cleanup ambient sound on unmount
  useEffect(() => {
    return () => {
      if (ambientSound) {
        ambientSound.unloadAsync();
      }
    };
  }, [ambientSound]);

  const handleSoundSelect = async (soundId: string) => {
    try {
      // Stop current sound if playing
      if (ambientSound) {
        await ambientSound.unloadAsync();
        setAmbientSound(null);
      }

      const soundData = relaxationSounds.find(s => s.id === soundId);
      if (!soundData) return;

      // Create and play new sound
      const { sound } = await Audio.Sound.createAsync(
        soundData.url,
        { 
        shouldPlay: true,
        isLooping: true,
          volume: 0.5
        }
      );

      setAmbientSound(sound);
      setSelectedSound(soundId);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing ambient sound:', error);
      Alert.alert('Audio Error', 'Could not play ambient sound. Please check your internet connection.');
    }
  };

  const handleStopSound = async () => {
    try {
      if (ambientSound) {
        await ambientSound.unloadAsync();
        setAmbientSound(null);
      }
      setIsPlaying(false);
      setSelectedSound(null);
    } catch (error) {
      console.error('Error stopping ambient sound:', error);
    }
  };

  const handleClose = async () => {
    // Stop any playing ambient sounds
    if (ambientSound) {
      try {
        await ambientSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping sound on close:', error);
      }
    }
    navigation.goBack();
  };

  const handleStartSleepMode = async () => {
    try {
      await startSleepSession();
      Alert.alert(
        'Sleep Mode Started! 🌙',
        'Your sleep session has begun. Sweet dreams!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to start sleep mode. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAdjustSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleIdeaToggle = (index: number) => {
    setExpandedIdea(expandedIdea === index ? null : index);
  };

  const handleStartExercise = (exerciseId: string, voiceSettings: VoiceSettings) => {
    setCurrentExercise({ id: exerciseId, voiceSettings });
    setShowExercisePlayer(true);
  };

  const handleCloseExercisePlayer = () => {
    setShowExercisePlayer(false);
    setCurrentExercise(null);
  };

  return (
    <View style={styles.container}>
            <View style={styles.header}>
        <Text style={styles.title}>Can't Sleep? 😴</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
          bounces={true}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Extra spacing to ensure scrollable content */}
          <View style={styles.extraSpacing} />
          
          {/* Sleep Coach */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Sleep Coach</Text>
            <Text style={styles.sectionDescription}>
              Chat with an AI sleep expert for personalized advice and support
            </Text>
                  <TouchableOpacity
              style={styles.sleepCoachButton}
              onPress={() => setShowSleepCoach(true)}
                  >
              <Text style={styles.buttonText}>Talk to Sleep Coach</Text>
                  </TouchableOpacity>
          </View>

          {/* Guided Exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎙️ Guided Exercises</Text>
            <Text style={styles.sectionDescription}>
              Choose from guided breathing, body scan, or mindfulness exercises with customizable voices
            </Text>
                  <TouchableOpacity
              style={styles.breathingButton}
              onPress={() => setShowGuidedExercises(true)}
                  >
              <Text style={styles.buttonText}>Start Guided Exercise</Text>
                  </TouchableOpacity>
                </View>

          {/* Ambient Sounds */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ambient Sounds</Text>
            <Text style={styles.sectionDescription}>
              Choose a calming sound to help you fall asleep
            </Text>
            
            {relaxationSounds.map((sound) => (
              <TouchableOpacity
                key={sound.id}
                style={[
                  styles.soundButton,
                  selectedSound === sound.id && styles.soundButtonActive
                ]}
                onPress={() => handleSoundSelect(sound.id)}
              >
                <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                <Text style={styles.soundName}>{sound.name}</Text>
                {selectedSound === sound.id && (
                  <Text style={styles.playingText}>Playing...</Text>
                )}
              </TouchableOpacity>
            ))}

            {isPlaying && (
              <TouchableOpacity style={styles.stopButton} onPress={handleStopSound}>
                <Text style={styles.buttonText}>Stop Sound</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sleepy Ideas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sleepy Ideas</Text>
            <Text style={styles.sectionDescription}>
              Try one of these techniques to help you fall asleep
            </Text>
            
            {sleepyIdeas.map((idea, index) => (
                    <TouchableOpacity
                key={index}
                style={styles.ideaButton}
                onPress={() => handleIdeaToggle(index)}
              >
                <View style={styles.ideaButtonContent}>
                  <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
                  <View style={styles.ideaTextContainer}>
                    <Text style={styles.ideaTitle}>{idea.title}</Text>
                    <Text style={styles.ideaDescription}>{idea.description}</Text>
                  </View>
                  <Text style={styles.expandIcon}>
                    {expandedIdea === index ? '−' : '+'}
                      </Text>
                </View>
                
                {expandedIdea === index && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.expandedDetails}>{idea.details}</Text>
                    <Text style={styles.stepsTitle}>Steps:</Text>
                    {idea.steps.map((step, stepIndex) => (
                      <View key={stepIndex} style={styles.stepItem}>
                        <Text style={styles.stepNumber}>{stepIndex + 1}</Text>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isSleepMode && styles.actionButtonDisabled
              ]}
              onPress={handleStartSleepMode}
              disabled={isSleepMode}
            >
              <Text style={[
                styles.buttonText,
                isSleepMode && styles.buttonTextDisabled
              ]}>
                {isSleepMode ? 'Sleep Mode Active' : 'Start Sleep Mode'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAdjustSettings}
            >
              <Text style={styles.buttonText}>Adjust Settings</Text>
            </TouchableOpacity>
              </View>

          {/* Additional content to ensure scrolling */}
          <View style={styles.bottomSpacing}>
            <Text style={styles.bottomText}>Sweet dreams! 🌙</Text>
            <View style={styles.extraBottomSpacing} />
          </View>
        </ScrollView>

      {/* Sleep Coach Chat Modal */}
      <SleepCoachChat 
        visible={showSleepCoach}
        onClose={() => setShowSleepCoach(false)} 
      />

      {/* Guided Exercise Selection Modal */}
      <GuidedExerciseModal
        visible={showGuidedExercises}
        onClose={() => setShowGuidedExercises(false)}
        onStartExercise={handleStartExercise}
      />

      {/* Exercise Player Modal */}
      {currentExercise && (
        <ExercisePlayer
          visible={showExercisePlayer}
          exerciseId={currentExercise.id}
          voiceSettings={currentExercise.voiceSettings}
          onClose={handleCloseExercisePlayer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'scroll', // Force scroll on web
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
    minHeight: Platform.OS === 'web' ? '120vh' : '100%', // Make content taller on web to force scroll
    flexGrow: 1, // Ensure content grows to fill space
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 15,
  },
  sleepCoachButton: {
    backgroundColor: '#9B7EDE',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  breathingButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  soundButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  soundEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  soundName: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  playingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  ideaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ideaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  ideaEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  ideaTextContainer: {
    flex: 1,
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  ideaDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9B7EDE',
    marginLeft: 10,
  },
  expandedContent: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedDetails: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 15,
    lineHeight: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9B7EDE',
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9B7EDE',
    marginRight: 10,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#9B7EDE',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(155, 126, 222, 0.5)',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
  webScrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webScrollContent: {
    padding: 20,
    paddingBottom: 40,
    minHeight: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  extraSpacing: {
    height: Platform.OS === 'web' ? 50 : 20,
  },
  bottomSpacing: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 20,
  },
  bottomText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  extraBottomSpacing: {
    height: Platform.OS === 'web' ? 100 : 50,
  },
});

export default RelaxationModal;