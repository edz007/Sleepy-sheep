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
import { SheepEvolution } from '../utils/pointsCalculator';

const { width, height } = Dimensions.get('window');

interface SheepEvolutionProps {
  visible: boolean;
  fromStage: string;
  toStage: string;
  onComplete: () => void;
}

const SheepEvolution: React.FC<SheepEvolutionProps> = ({
  visible,
  fromStage,
  toStage,
  onComplete,
}) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.5)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;
  const particleAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startEvolutionAnimation();
    }
  }, [visible]);

  const startEvolutionAnimation = () => {
    // Reset animations
    fadeAnimation.setValue(0);
    scaleAnimation.setValue(0.5);
    rotationAnimation.setValue(0);
    particleAnimation.setValue(0);
    glowAnimation.setValue(0);

    // Start the evolution sequence
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
      // Start rotation and glow
      Animated.loop(
        Animated.timing(rotationAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        { iterations: 3 }
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();

      // Start particle animation
      Animated.timing(particleAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Complete evolution after 6 seconds
      setTimeout(() => {
        completeEvolution();
      }, 6000);
    });
  };

  const completeEvolution = () => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const getStageEmoji = (stage: string) => {
    const stageEmojis = {
      baby: '🐑',
      fluffy: '🐑✨',
      dreamy: '🐑🌙',
      cloud_guardian: '🐑👑',
    };
    return stageEmojis[stage as keyof typeof stageEmojis] || '🐑';
  };

  const getStageName = (stage: string) => {
    return SheepEvolution.getStageNameWithLevel(stage);
  };

  const getEvolutionMessage = (toStage: string) => {
    return SheepEvolution.getEvolutionMessage(toStage);
  };

  const rotationTransform = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const particleTransform = particleAnimation.interpolate({
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
          { opacity: fadeAnimation }
        ]}
      >
        <View style={styles.container}>
          {/* Evolution Title */}
          <Animated.Text 
            style={[
              styles.title,
              {
                opacity: fadeAnimation,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            Evolution to Level {SheepEvolution.getLevelNumber(toStage)}!
          </Animated.Text>

          {/* From Stage */}
          <Animated.View 
            style={[
              styles.stageContainer,
              {
                opacity: fadeAnimation,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            <Text style={styles.stageLabel}>From:</Text>
            <Text style={styles.stageEmoji}>{getStageEmoji(fromStage)}</Text>
            <Text style={styles.stageName}>{getStageName(fromStage)}</Text>
          </Animated.View>

          {/* Evolution Arrow */}
          <Animated.View 
            style={[
              styles.arrowContainer,
              {
                opacity: fadeAnimation,
                transform: [
                  { scale: scaleAnimation },
                  { rotate: rotationTransform },
                ],
              },
            ]}
          >
            <Text style={styles.arrow}>✨</Text>
            <Text style={styles.arrow}>⬇️</Text>
            <Text style={styles.arrow}>✨</Text>
          </Animated.View>

          {/* To Stage */}
          <Animated.View 
            style={[
              styles.stageContainer,
              {
                opacity: glowOpacity,
                transform: [
                  { scale: scaleAnimation },
                  { rotate: rotationTransform },
                ],
              },
            ]}
          >
            <Text style={styles.stageLabel}>To:</Text>
            <Text style={styles.stageEmoji}>{getStageEmoji(toStage)}</Text>
            <Text style={styles.stageName}>{getStageName(toStage)}</Text>
          </Animated.View>

          {/* Evolution Message */}
          <Animated.Text 
            style={[
              styles.message,
              {
                opacity: fadeAnimation,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            {getEvolutionMessage(toStage)}
          </Animated.Text>

          {/* Particle Effects */}
          <View style={styles.particlesContainer}>
            {[...Array(12)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    transform: [
                      {
                        translateX: particleTransform.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (Math.random() - 0.5) * 200],
                        }),
                      },
                      {
                        translateY: particleTransform.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (Math.random() - 0.5) * 200],
                        }),
                      },
                      {
                        scale: particleTransform.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                    opacity: particleTransform.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              >
                <Text style={styles.particleText}>✨</Text>
              </Animated.View>
            ))}
          </View>

          {/* Glow Effect */}
          <Animated.View 
            style={[
              styles.glowEffect,
              {
                opacity: glowOpacity,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          />

          {/* Skip Button */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={onComplete}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 40,
    maxWidth: width * 0.9,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  stageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    minWidth: 200,
  },
  stageLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 10,
  },
  stageEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  stageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  arrow: {
    fontSize: 16,
    marginVertical: 3,
  },
  message: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
    lineHeight: 24,
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleText: {
    fontSize: 12,
  },
  glowEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SheepEvolution;
