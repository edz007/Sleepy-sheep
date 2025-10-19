import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { exerciseTypes } from '../data/exerciseScripts';
import { VoiceSettings, ElevenLabsService } from '../services/elevenLabsService';

interface GuidedExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onStartExercise: (exerciseId: string, voiceSettings: VoiceSettings) => void;
}

const GuidedExerciseModal: React.FC<GuidedExerciseModalProps> = ({
  visible,
  onClose,
  onStartExercise,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    gender: 'female',
    accent: 'american',
    similarityBoost: 0.5, // Voice consistency
  });
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const elevenLabsService = ElevenLabsService.getInstance();

  const handleStartExercise = () => {
    if (!selectedExercise) {
      Alert.alert('Please select an exercise', 'Choose a guided exercise to begin.');
      return;
    }
    onStartExercise(selectedExercise, voiceSettings);
    onClose();
  };

  const handlePreviewVoice = async () => {
    if (!selectedExercise) {
      Alert.alert('Please select an exercise', 'Choose an exercise first to preview the voice.');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const exercise = exerciseTypes.find(e => e.id === selectedExercise);
      if (!exercise) return;

      const previewText = exercise.script.substring(0, 150) + '...';
      const audioUrl = await elevenLabsService.generatePreviewAudio(previewText, voiceSettings);
      
      // For web compatibility, we'll use HTML5 audio
      if (typeof window !== 'undefined' && window.Audio) {
        const audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.error('Error playing preview audio:', error);
          Alert.alert('Preview Error', 'Could not play audio preview. Please check your audio settings.');
        });
      } else {
        Alert.alert('Preview', 'Voice preview generated successfully!');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      Alert.alert('Preview Error', 'Could not generate voice preview. Please check your ElevenLabs API key.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const accentOptions = [
    { value: 'american', label: 'American English' },
    { value: 'british', label: 'British English' },
    { value: 'indian', label: 'Indian English' },
    { value: 'singaporean', label: 'Singaporean English' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Guided Exercises</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Exercise Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Exercise:</Text>
            <View style={styles.exerciseGrid}>
              {exerciseTypes.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseCard,
                    selectedExercise === exercise.id && styles.exerciseCardSelected,
                  ]}
                  onPress={() => setSelectedExercise(exercise.id)}
                >
                  <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Voice Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Settings:</Text>
            
            {/* Gender Selection */}
            <View style={styles.voiceOption}>
              <Text style={styles.voiceLabel}>Gender:</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    voiceSettings.gender === 'male' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setVoiceSettings(prev => ({ ...prev, gender: 'male' }))}
                >
                  <Text style={[
                    styles.genderButtonText,
                    voiceSettings.gender === 'male' && styles.genderButtonTextSelected,
                  ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    voiceSettings.gender === 'female' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setVoiceSettings(prev => ({ ...prev, gender: 'female' }))}
                >
                  <Text style={[
                    styles.genderButtonText,
                    voiceSettings.gender === 'female' && styles.genderButtonTextSelected,
                  ]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Accent Selection */}
            <View style={styles.voiceOption}>
              <Text style={styles.voiceLabel}>Accent:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accentScroll}>
                {accentOptions.map((accent) => (
                  <TouchableOpacity
                    key={accent.value}
                    style={[
                      styles.accentButton,
                      voiceSettings.accent === accent.value && styles.accentButtonSelected,
                    ]}
                    onPress={() => setVoiceSettings(prev => ({ ...prev, accent: accent.value as any }))}
                  >
                    <Text style={[
                      styles.accentButtonText,
                      voiceSettings.accent === accent.value && styles.accentButtonTextSelected,
                    ]}>
                      {accent.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreviewVoice}
              disabled={isGeneratingPreview}
            >
              {isGeneratingPreview ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.previewButtonText}>🎵 Preview Voice</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startButton,
                !selectedExercise && styles.startButtonDisabled,
              ]}
              onPress={handleStartExercise}
              disabled={!selectedExercise}
            >
              <Text style={[
                styles.startButtonText,
                !selectedExercise && styles.startButtonTextDisabled,
              ]}>
                🎙️ Start Exercise
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exerciseCard: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  exerciseCardSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  voiceOption: {
    marginBottom: 16,
  },
  voiceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  accentScroll: {
    flexDirection: 'row',
  },
  accentButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 8,
  },
  accentButtonSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  accentButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  accentButtonTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 40,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3498db',
    marginLeft: -8,
  },
  sliderDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  valueDisplay: {
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  previewButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButtonTextDisabled: {
    color: '#95a5a6',
  },
});

export default GuidedExerciseModal;
