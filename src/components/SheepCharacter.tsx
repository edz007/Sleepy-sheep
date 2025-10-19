import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
} from 'react-native';
// import { Audio } from 'expo-av';
import { useSheep } from '../contexts/SheepContext';

// Mock Audio for web compatibility
const Audio = {
  Sound: {
    createAsync: async (source: any, options: any) => {
      console.log('Audio not available on web:', source, options);
      return { sound: null };
    },
  },
};

const { width, height } = Dimensions.get('window');

interface SheepCharacterProps {
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showAccessories?: boolean;
  onPet?: () => void;
  onTap?: () => void;
  isSleepMode?: boolean; // Add sleep mode prop
}

const SheepCharacter: React.FC<SheepCharacterProps> = ({
  size = 'medium',
  interactive = true,
  showAccessories = true,
  onPet,
  onTap,
  isSleepMode = false,
}) => {
  const { sheepStage, sheepMood, totalPoints, addPoints } = useSheep();
  
  // Animation values
  const bounceAnimation = useRef(new Animated.Value(1)).current;
  const wiggleAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  
  // Ref to track current mood for animations
  const currentMoodRef = useRef(sheepMood);
  
  // Update mood ref when mood changes
  useEffect(() => {
    currentMoodRef.current = sheepMood;
  }, [sheepMood]);
  
  // State
  const [isPetting, setIsPetting] = useState(false);
  const [petCount, setPetCount] = useState(0);
  const [lastPetTime, setLastPetTime] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Size configurations
  const sizeConfig = {
    small: { fontSize: 40, containerSize: 80 },
    medium: { fontSize: 60, containerSize: 120 },
    large: { fontSize: 100, containerSize: 160 },
  };

  const currentSize = sizeConfig[size];

  useEffect(() => {
    startIdleAnimations();
    loadSound();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Trigger mood-specific animations
    console.log('SheepCharacter: sheepMood changed to:', sheepMood, 'isSleepMode:', isSleepMode);
    triggerMoodAnimation();
  }, [sheepMood, isSleepMode]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../src/assets/sounds/sheep_baa.mp3'), // Placeholder
        { shouldPlay: false }
      );
      setSound(newSound);
    } catch (error) {
      console.log('Could not load sheep sound:', error);
    }
  };

  const startIdleAnimations = () => {
    // Gentle floating animation
    const float = () => {
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: -5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        float();
      });
    };
    float();

    // Occasional wiggle
    const wiggle = () => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(wiggleAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnimation, {
            toValue: -1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        wiggle();
      }, Math.random() * 5000 + 3000); // Random interval between 3-8 seconds
    };
    wiggle();
  };

  const triggerMoodAnimation = () => {
    console.log('triggerMoodAnimation called with sheepMood:', sheepMood);
    switch (sheepMood) {
      case 'happy':
        console.log('Triggering happy animation');
        triggerHappyAnimation();
        break;
      case 'excited':
        console.log('Triggering excited animation');
        triggerExcitedAnimation();
        break;
      case 'sad':
        console.log('Triggering sad animation');
        triggerSadAnimation();
        break;
      case 'sleeping':
        console.log('Triggering sleeping animation');
        triggerSleepingAnimation();
        break;
      case 'yawning':
        console.log('Triggering yawning animation');
        triggerYawningAnimation();
        break;
    }
  };

  const triggerHappyAnimation = () => {
    Animated.sequence([
      Animated.timing(bounceAnimation, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerExcitedAnimation = () => {
    console.log('triggerExcitedAnimation called');
    // Continuous bouncing for excitement
    const excitedBounce = () => {
      console.log('excitedBounce animation running - sheepMood:', sheepMood);
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Use ref to get the current mood value instead of closure
        const currentMood = currentMoodRef.current;
        console.log('excitedBounce completed - checking if should continue:', currentMood === 'excited');
        if (currentMood === 'excited') {
          excitedBounce();
        } else {
          console.log('excitedBounce animation stopping');
        }
      });
    };
    excitedBounce();
  };

  const triggerSadAnimation = () => {
    Animated.timing(scaleAnimation, {
      toValue: 0.9,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const triggerSleepingAnimation = () => {
    console.log('triggerSleepingAnimation called - sheepMood:', sheepMood, 'isSleepMode:', isSleepMode);
    // Gentle breathing animation
    const breathe = () => {
      console.log('breathe animation running - sheepMood:', sheepMood, 'isSleepMode:', isSleepMode);
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Use ref to get the current mood value instead of closure
        const currentMood = currentMoodRef.current;
        console.log('breathe animation completed - checking if should continue:', currentMood === 'sleeping' && isSleepMode);
        if (currentMood === 'sleeping' && isSleepMode) {
          breathe();
        } else {
          console.log('breathe animation stopping');
        }
      });
    };
    breathe();
  };

  const triggerYawningAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePet = async () => {
    if (!interactive) return;

    const now = Date.now();
    const timeSinceLastPet = now - lastPetTime;
    
    // Prevent spam petting (minimum 500ms between pets)
    if (timeSinceLastPet < 500) return;

    setIsPetting(true);
    setLastPetTime(now);
    setPetCount(prev => prev + 1);

    // Petting animation
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Play sound
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.log('Could not play sound:', error);
      }
    }

    // Award points for petting (every 5 pets = 1 point)
    if (petCount > 0 && petCount % 5 === 0) {
      addPoints(1);
    }

    // Trigger happy animation
    triggerHappyAnimation();

    // Call onPet callback
    if (onPet) {
      onPet();
    }

    // Reset petting state
    setTimeout(() => {
      setIsPetting(false);
    }, 200);
  };

  const handleTap = () => {
    if (onTap) {
      onTap();
    }
    
    // Quick tap animation
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getSheepEmoji = () => {
    const stageEmojis = {
      baby: '🐑',
      fluffy: '🐑',
      dreamy: '🐑',
      cloud_guardian: '🐑',
    };
    
    return stageEmojis[sheepStage] || '🐑'; // Fallback to sheep emoji
  };

  const getStageDecoration = () => {
    const decorations = {
      baby: '',
      fluffy: '✨',
      dreamy: '🌙',
      cloud_guardian: '👑',
    };
    
    return decorations[sheepStage];
  };

  const getMoodEmoji = () => {
    const moodEmojis = {
      happy: '😊',
      excited: '🤩',
      sad: '😢',
      sleeping: '😴',
      yawning: '🥱',
    };
    
    return moodEmojis[sheepMood] || '😊'; // Fallback to happy emoji
  };


  const getSheepColor = () => {
    switch (sheepStage) {
      case 'baby': return '#FFFFFF'; // White
      case 'fluffy': return '#FFB6C1'; // Light Pink
      case 'dreamy': return '#E6E6FA'; // Lavender
      case 'cloud_guardian': return '#F0F8FF'; // Alice Blue
      default: return '#FFFFFF'; // White
    }
  };

  const getSheepGlowColor = () => {
    switch (sheepStage) {
      case 'baby': return 'rgba(255, 255, 255, 0.3)'; // White glow
      case 'fluffy': return 'rgba(255, 182, 193, 0.4)'; // Pink glow
      case 'dreamy': return 'rgba(230, 230, 250, 0.5)'; // Lavender glow
      case 'cloud_guardian': return 'rgba(240, 248, 255, 0.6)'; // Blue glow
      default: return 'rgba(255, 255, 255, 0.3)'; // White glow
    }
  };

  const getSheepShadowColor = () => {
    switch (sheepStage) {
      case 'baby': return 'rgba(255, 255, 255, 0.2)'; // White shadow
      case 'fluffy': return 'rgba(255, 182, 193, 0.3)'; // Pink shadow
      case 'dreamy': return 'rgba(230, 230, 250, 0.4)'; // Lavender shadow
      case 'cloud_guardian': return 'rgba(240, 248, 255, 0.5)'; // Blue shadow
      default: return 'rgba(255, 255, 255, 0.2)'; // White shadow
    }
  };

  const wiggleTransform = wiggleAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  const rotationTransform = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleTap}
      onLongPress={handlePet}
      activeOpacity={0.8}
      disabled={!interactive}
    >
      <Animated.View
        style={[
          styles.sheepContainer,
          {
            width: currentSize.containerSize,
            height: currentSize.containerSize,
            backgroundColor: getSheepGlowColor(),
            borderColor: getSheepColor(),
            shadowColor: getSheepShadowColor(),
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 20,
            transform: [
              { scale: scaleAnimation },
              { scale: bounceAnimation },
              { translateY: floatAnimation },
              { rotate: wiggleTransform },
            ],
          },
        ]}
      >
        {/* Main Sheep */}
        <Text style={[
          styles.sheepEmoji, 
          { 
            fontSize: currentSize.fontSize,
            textShadowColor: getSheepColor(),
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
          }
        ]}>
          {getSheepEmoji()}
        </Text>
        
        {/* Stage Decoration */}
        {(() => {
          const decoration = getStageDecoration();
          return decoration && decoration.trim() !== '' ? (
            <Text style={[
              styles.stageDecoration,
              { 
                fontSize: currentSize.fontSize * 0.4, // Smaller decoration
                textShadowColor: getSheepColor(),
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 5,
              }
            ]}>
              {decoration}
            </Text>
          ) : null;
        })()}
        
        {/* Mood Indicator */}
        <View style={styles.moodIndicator}>
          <Text style={styles.moodEmoji}>{getMoodEmoji()}</Text>
        </View>
        
        {/* Accessories */}
        {showAccessories && (
          <View style={styles.accessoriesContainer}>
            {/* This would be dynamic based on equipped accessories */}
            {totalPoints >= 100 && <Text style={styles.accessory}>🎩</Text>}
            {totalPoints >= 200 && <Text style={styles.accessory}>👓</Text>}
            {totalPoints >= 300 && <Text style={styles.accessory}>🎀</Text>}
          </View>
        )}
        
        {/* Petting Effect */}
        {isPetting && (
          <Animated.View style={styles.pettingEffect}>
            <Text style={styles.pettingText}>✨</Text>
          </Animated.View>
        )}
        
        {/* Pet Counter */}
        {petCount > 0 && (
          <View style={styles.petCounter}>
            <Text style={styles.petCounterText}>
              {petCount} pets
            </Text>
          </View>
        )}
      </Animated.View>
      
      {/* Interaction Hint */}
      {interactive && (
        <View style={styles.interactionHint}>
          <Text style={styles.hintText}>
            Tap to interact • Long press to pet
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 50, // Make it circular
    borderWidth: 2,
    overflow: 'hidden', // Keep sheep within the container
  },
  sheepEmoji: {
    textAlign: 'center',
  },
  stageDecoration: {
    position: 'absolute',
    top: 5,
    right: 5,
    textAlign: 'center',
  },
  moodIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 5,
    minWidth: 30,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 16,
  },
  accessoriesContainer: {
    position: 'absolute',
    top: -20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessory: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  pettingEffect: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
  },
  pettingText: {
    fontSize: 24,
    color: '#FFD700',
  },
  petCounter: {
    position: 'absolute',
    bottom: -25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  petCounterText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  interactionHint: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  hintText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default SheepCharacter;
