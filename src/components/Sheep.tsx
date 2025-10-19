import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { SheepStage, SheepMood } from '@/types';

interface SheepProps {
  stage: SheepStage;
  mood: SheepMood;
  accessories: string[];
  size?: number;
  onPress?: () => void;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function Sheep({ stage, mood, accessories, size = 150, onPress }: SheepProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce animation for happy/excited mood
    if (mood === 'happy' || mood === 'excited') {
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      bounceAnimation.start();
    } else {
      bounceAnim.setValue(0);
    }

    // Blink animation
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );
    blinkAnimation.start();

    // Sparkle animation for excited mood
    if (mood === 'excited') {
      const sparkleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      sparkleAnimation.start();
    }
  }, [mood]);

  const getSheepColor = () => {
    switch (mood) {
      case 'sad':
        return '#E0E0E0';
      case 'sleepy':
        return '#F0F0F0';
      default:
        return '#FFFFFF';
    }
  };

  const getEyeColor = () => {
    switch (mood) {
      case 'sad':
        return '#666666';
      case 'sleepy':
        return '#888888';
      default:
        return '#333333';
    }
  };

  const renderAccessories = () => {
    return accessories.map((accessory, index) => {
      switch (accessory) {
        case 'hat_simple':
          return (
            <Path
              key={index}
              d={`M${size * 0.3} ${size * 0.2} Q${size * 0.5} ${size * 0.1} ${size * 0.7} ${size * 0.2} L${size * 0.7} ${size * 0.3} L${size * 0.3} ${size * 0.3} Z`}
              fill="#8B4513"
            />
          );
        case 'scarf_cozy':
          return (
            <Path
              key={index}
              d={`M${size * 0.4} ${size * 0.5} L${size * 0.6} ${size * 0.5} L${size * 0.6} ${size * 0.7} L${size * 0.4} ${size * 0.7} Z`}
              fill="#FF6B6B"
            />
          );
        case 'glasses_cute':
          return (
            <G key={index}>
              <Circle cx={size * 0.4} cy={size * 0.4} r={size * 0.08} fill="none" stroke="#333" strokeWidth="2" />
              <Circle cx={size * 0.6} cy={size * 0.4} r={size * 0.08} fill="none" stroke="#333" strokeWidth="2" />
              <Path d={`M${size * 0.48} ${size * 0.4} L${size * 0.52} ${size * 0.4}`} stroke="#333" strokeWidth="2" />
            </G>
          );
        default:
          return null;
      }
    });
  };

  const renderSparkles = () => {
    if (mood !== 'excited') return null;

    return (
      <G>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: Math.random() * size,
              top: Math.random() * size,
              opacity: sparkleAnim,
              transform: [
                {
                  scale: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                },
              ],
            }}
          >
            <Text style={{ fontSize: 16, color: '#FFD700' }}>✨</Text>
          </Animated.View>
        ))}
      </G>
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        <AnimatedSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Sheep body */}
          <Ellipse
            cx={size * 0.5}
            cy={size * 0.6}
            rx={size * 0.25}
            ry={size * 0.2}
            fill={getSheepColor()}
            stroke="#E0E0E0"
            strokeWidth="2"
          />
          
          {/* Sheep head */}
          <Circle
            cx={size * 0.5}
            cy={size * 0.4}
            r={size * 0.15}
            fill={getSheepColor()}
            stroke="#E0E0E0"
            strokeWidth="2"
          />
          
          {/* Eyes */}
          <Animated.View
            style={{
              opacity: blinkAnim,
            }}
          >
            <Circle cx={size * 0.45} cy={size * 0.38} r={size * 0.02} fill={getEyeColor()} />
            <Circle cx={size * 0.55} cy={size * 0.38} r={size * 0.02} fill={getEyeColor()} />
          </Animated.View>
          
          {/* Nose */}
          <Ellipse
            cx={size * 0.5}
            cy={size * 0.42}
            rx={size * 0.015}
            ry={size * 0.01}
            fill="#FFB6C1"
          />
          
          {/* Mouth */}
          <Path
            d={`M${size * 0.48} ${size * 0.45} Q${size * 0.5} ${size * 0.48} ${size * 0.52} ${size * 0.45}`}
            stroke={mood === 'sad' ? '#666' : '#333'}
            strokeWidth="1"
            fill="none"
          />
          
          {/* Ears */}
          <Ellipse
            cx={size * 0.42}
            cy={size * 0.32}
            rx={size * 0.04}
            ry={size * 0.06}
            fill={getSheepColor()}
            stroke="#E0E0E0"
            strokeWidth="1"
          />
          <Ellipse
            cx={size * 0.58}
            cy={size * 0.32}
            rx={size * 0.04}
            ry={size * 0.06}
            fill={getSheepColor()}
            stroke="#E0E0E0"
            strokeWidth="1"
          />
          
          {/* Legs */}
          <Ellipse cx={size * 0.4} cy={size * 0.8} rx={size * 0.03} ry={size * 0.08} fill={getSheepColor()} />
          <Ellipse cx={size * 0.6} cy={size * 0.8} rx={size * 0.03} ry={size * 0.08} fill={getSheepColor()} />
          
          {/* Accessories */}
          {renderAccessories()}
        </AnimatedSvg>
        
        {/* Sparkles overlay */}
        {renderSparkles()}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
