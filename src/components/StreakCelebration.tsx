import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Modal,
  TouchableOpacity,
  Dimensions 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface StreakCelebrationProps {
  visible: boolean;
  streakCount: number;
  milestone: number;
  onClose: () => void;
}

const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  visible,
  streakCount,
  milestone,
  onClose,
}) => {
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const fireworkAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fireworkAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '✨';
    return '💫';
  };

  const getStreakMessage = (milestone: number) => {
    const messages = {
      3: 'Great start! You\'re building a habit!',
      7: 'Amazing! You\'ve completed a full week!',
      14: 'Incredible! Two weeks of consistency!',
      30: 'Legendary! A full month of dedication!',
      60: 'Unstoppable! Two months of excellence!',
      100: 'Master level! 100 days of perfection!',
    };
    return messages[milestone as keyof typeof messages] || 'Fantastic streak!';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#FFD700';
    if (streak >= 14) return '#FF6B6B';
    if (streak >= 7) return '#4ECDC4';
    if (streak >= 3) return '#45B7D1';
    return '#95A5A6';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: opacityAnimation }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnimation }],
                borderColor: getStreakColor(streakCount),
              },
            ]}
          >
            {/* Fireworks Animation */}
            <Animated.View
              style={[
                styles.fireworks,
                {
                  opacity: fireworkAnimation,
                  transform: [
                    {
                      scale: fireworkAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.5],
                      }),
                    },
                  ],
                },
              ]}
            >
              {[...Array(8)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.firework,
                    {
                      transform: [
                        {
                          rotate: fireworkAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.fireworkEmoji}>🎆</Text>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Confetti */}
            <Animated.View
              style={[
                styles.confetti,
                { opacity: confettiAnimation }
              ]}
            >
              {[...Array(12)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.confettiPiece,
                    {
                      transform: [
                        {
                          translateY: confettiAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -200],
                          }),
                        },
                        {
                          rotate: confettiAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '720deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.confettiEmoji}>🎉</Text>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Main Content */}
            <View style={styles.content}>
              {/* Streak Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getStreakEmoji(streakCount)}</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>Streak Milestone!</Text>
              
              {/* Streak Count */}
              <Text style={styles.streakCount}>{streakCount} Days</Text>
              
              {/* Message */}
              <Text style={styles.message}>{getStreakMessage(milestone)}</Text>
              
              {/* Bonus Points */}
              <View style={styles.bonusContainer}>
                <Text style={styles.bonusLabel}>Streak Bonus</Text>
                <Text style={styles.bonusPoints}>+{milestone * 2} Points</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Keep Going!</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
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
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#B8A4E4',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    maxWidth: width * 0.9,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  fireworks: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firework: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireworkEmoji: {
    fontSize: 20,
  },
  confetti: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiEmoji: {
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  streakCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  bonusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  bonusLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 5,
  },
  bonusPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#9B7EDE',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StreakCelebration;
