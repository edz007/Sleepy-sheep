import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SheepCelebrationProps {
  visible: boolean;
  type: 'achievement' | 'streak' | 'evolution' | 'points' | 'petting';
  message: string;
  sheepStage: string;
  sheepMood: string;
  onComplete: () => void;
}

const SheepCelebration: React.FC<SheepCelebrationProps> = ({
  visible,
  type,
  message,
  sheepStage,
  sheepMood,
  onComplete,
}) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.5)).current;
  const bounceAnimation = useRef(new Animated.Value(1)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;
  const particleAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startCelebrationAnimation();
    }
  }, [visible]);

  const startCelebrationAnimation = () => {
    // Reset animations
    fadeAnimation.setValue(0);
    scaleAnimation.setValue(0.5);
    bounceAnimation.setValue(1);
    rotationAnimation.setValue(0);
    particleAnimation.setValue(0);
    confettiAnimation.setValue(0);

    // Start the celebration sequence
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start bouncing animation
      const bounce = () => {
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible) {
            bounce();
          }
        });
      };
      bounce();

      // Start rotation animation
      Animated.loop(
        Animated.timing(rotationAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        { iterations: 2 }
      ).start();

      // Start particle animation
      Animated.timing(particleAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();

      // Start confetti animation
      Animated.timing(confettiAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Auto complete after 4 seconds
      setTimeout(() => {
        completeCelebration();
      }, 4000);
    });
  };

  const completeCelebration = () => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
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
      excited: '🤩',
      sad: '😢',
      sleeping: '😴',
      yawning: '🥱',
    };

    return `${stageEmojis[sheepStage]} ${moodEmojis[sheepMood]}`;
  };

  const getCelebrationEmojis = () => {
    switch (type) {
      case 'achievement':
        return ['🏆', '⭐', '🎉', '✨', '🌟'];
      case 'streak':
        return ['🔥', '💪', '⚡', '🎯', '🏅'];
      case 'evolution':
        return ['✨', '🌟', '💫', '⭐', '🎊'];
      case 'points':
        return ['💰', '💎', '🎁', '💝', '🎈'];
      case 'petting':
        return ['💕', '😍', '🥰', '💖', '💗'];
      default:
        return ['🎉', '✨', '🌟', '💫', '⭐'];
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'achievement':
        return '#FFD700';
      case 'streak':
        return '#FF6B6B';
      case 'evolution':
        return '#9B59B6';
      case 'points':
        return '#4CAF50';
      case 'petting':
        return '#E91E63';
      default:
        return '#B8A4E4';
    }
  };

  const rotationTransform = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particleTransform = particleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const confettiTransform = confettiAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onComplete}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { 
            opacity: fadeAnimation,
            backgroundColor: getBackgroundColor(),
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onComplete}
        >
          <View style={styles.container}>
            {/* Confetti */}
            <View style={styles.confettiContainer}>
              {[...Array(20)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.confetti,
                    {
                      transform: [
                        {
                          translateY: confettiTransform.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -300],
                          }),
                        },
                        {
                          translateX: confettiTransform.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, (Math.random() - 0.5) * 200],
                          }),
                        },
                        {
                          rotate: confettiTransform.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '720deg'],
                          }),
                        },
                      ],
                      opacity: confettiTransform.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0, 1, 0],
                      }),
                    },
                  ]}
                >
                  <Text style={styles.confettiEmoji}>
                    {getCelebrationEmojis()[index % getCelebrationEmojis().length]}
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* Main Sheep */}
            <Animated.View
              style={[
                styles.sheepContainer,
                {
                  transform: [
                    { scale: scaleAnimation },
                    { scale: bounceAnimation },
                    { rotate: rotationTransform },
                  ],
                },
              ]}
            >
              <Text style={styles.sheepEmoji}>{getSheepEmoji()}</Text>
            </Animated.View>

            {/* Celebration Message */}
            <Animated.Text 
              style={[
                styles.message,
                {
                  opacity: fadeAnimation,
                  transform: [{ scale: scaleAnimation }],
                },
              ]}
            >
              {message}
            </Animated.Text>

            {/* Particle Effects */}
            <View style={styles.particlesContainer}>
              {[...Array(15)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      transform: [
                        {
                          translateX: particleTransform.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, (Math.random() - 0.5) * 300],
                          }),
                        },
                        {
                          translateY: particleTransform.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, (Math.random() - 0.5) * 300],
                          }),
                        },
                        {
                          scale: particleTransform.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 1, 0],
                          }),
                        },
                      ],
                      opacity: particleTransform.interpolate({
                        inputRange: [0, 0.3, 0.7, 1],
                        outputRange: [0, 1, 1, 0],
                      }),
                    },
                  ]}
                >
                  <Text style={styles.particleEmoji}>
                    {getCelebrationEmojis()[index % getCelebrationEmojis().length]}
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* Celebration Type Indicator */}
            <Animated.View 
              style={[
                styles.typeIndicator,
                {
                  opacity: fadeAnimation,
                  transform: [{ scale: scaleAnimation }],
                },
              ]}
            >
              <Text style={styles.typeText}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Celebration!
              </Text>
            </Animated.View>

            {/* Tap to Continue */}
            <Animated.Text 
              style={[
                styles.tapHint,
                {
                  opacity: fadeAnimation,
                },
              ]}
            >
              Tap anywhere to continue
            </Animated.Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 40,
    maxWidth: width * 0.9,
  },
  confettiContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiEmoji: {
    fontSize: 20,
  },
  sheepContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sheepEmoji: {
    fontSize: 120,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    lineHeight: 32,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleEmoji: {
    fontSize: 18,
  },
  typeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SheepCelebration;
