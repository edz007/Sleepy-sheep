import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { exerciseScripts } from '../data/exerciseScripts';
import { VoiceSettings, ElevenLabsService } from '../services/elevenLabsService';

interface ExercisePlayerProps {
  visible: boolean;
  exerciseId: string;
  voiceSettings: VoiceSettings;
  onClose: () => void;
}

const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
  visible,
  exerciseId,
  voiceSettings,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const elevenLabsService = ElevenLabsService.getInstance();
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const exercise = exerciseScripts[exerciseId];

  useEffect(() => {
    if (visible && exercise) {
      loadExercise();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [visible, exerciseId]);

  const loadExercise = async () => {
    if (!exercise) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate audio using ElevenLabs
      const audioUrl = await elevenLabsService.generateAudio({
        text: exercise.script,
        voiceSettings,
      });

      // Create audio sound object
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            if (positionUpdateInterval.current) {
              clearInterval(positionUpdateInterval.current);
            }
          }
        }
      });

      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('Failed to load exercise audio. Please check your internet connection and API key.');
      setIsLoading(false);
    }
  };

  const playPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        if (positionUpdateInterval.current) {
          clearInterval(positionUpdateInterval.current);
        }
      } else {
        await sound.playAsync();
        setIsPlaying(true);
        
        // Start position update interval
        positionUpdateInterval.current = setInterval(() => {
          sound.getStatusAsync().then((status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis || 0);
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
      Alert.alert('Playback Error', 'Could not control audio playback.');
    }
  };

  const stop = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
      setPosition(0);
      
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const seekTo = async (timeMs: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(timeMs);
      setPosition(timeMs);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  const handleClose = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    onClose();
  };

  if (!exercise) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guided Exercise</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Exercise Info */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
          <Text style={styles.voiceInfo}>
            {voiceSettings.gender === 'male' ? '👨' : '👩'} {voiceSettings.accent} voice
          </Text>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Generating audio...</Text>
            <Text style={styles.loadingSubtext}>This may take a moment</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadExercise}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Player Controls */}
        {!isLoading && !error && sound && (
          <View style={styles.playerContainer}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.progressBarTouchable}
                onPress={(event) => {
                  const { locationX } = event.nativeEvent;
                  const progressBarWidth = Dimensions.get('window').width - 40;
                  const seekTime = (locationX / progressBarWidth) * duration;
                  seekTo(seekTime);
                }}
              />
            </View>

            {/* Time Display */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Control Buttons */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.stopButton} onPress={stop}>
                <Text style={styles.stopButtonText}>⏹️</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.playPauseButton} onPress={playPause}>
                <Text style={styles.playPauseButtonText}>
                  {isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.stopButton} onPress={handleClose}>
                <Text style={styles.stopButtonText}>❌</Text>
              </TouchableOpacity>
            </View>

            {/* Breathing Animation */}
            <View style={styles.animationContainer}>
              <View 
                style={[
                  styles.breathingCircle,
                  isPlaying && styles.breathingCircleActive
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 32,
  },
  exerciseInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  exerciseDuration: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  voiceInfo: {
    fontSize: 14,
    color: '#95a5a6',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  progressBarTouchable: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  timeText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 60,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 24,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButtonText: {
    fontSize: 32,
    color: '#fff',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e8f4fd',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  breathingCircleActive: {
    backgroundColor: '#d1ecf1',
    borderColor: '#17a2b8',
  },
});

export default ExercisePlayer;
