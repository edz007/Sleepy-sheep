import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SleepButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isSleeping?: boolean;
}

export default function SleepButton({ onPress, disabled = false, isSleeping = false }: SleepButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonText = () => {
    if (isSleeping) return 'Already Sleeping';
    return "I'm Going to Sleep";
  };

  const getButtonColors = () => {
    if (disabled || isSleeping) {
      return ['#CCCCCC', '#AAAAAA'];
    }
    return ['#FF6B6B', '#FF8E8E'];
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isSleeping}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getButtonColors()}
          style={[
            styles.button,
            (disabled || isSleeping) && styles.disabledButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {isSleeping ? '😴' : '🌙'} {getButtonText()}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
