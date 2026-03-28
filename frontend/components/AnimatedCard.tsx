/**
 * AnimatedCard Component
 * ─────────────────────────────────────────────────────────────────
 * Professional card with smooth entrance animations, press interactions,
 * and shadow effects.
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { triggerButtonHaptic } from '../utils/haptics';
import { useAppTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Easings } from '../utils/animations';

interface AnimatedCardProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  disabled?: boolean;
  hapticFeedback?: boolean;
  animateEntrance?: boolean;
  pressScale?: number;
}

export default function AnimatedCard({
  onPress,
  children,
  style,
  delay = 0,
  disabled = false,
  hapticFeedback = true,
  animateEntrance = true,
  pressScale = 0.98,
}: AnimatedCardProps) {
  const { theme } = useAppTheme();
  const { hapticFeedbackEnabled } = useUser();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(animateEntrance ? 20 : 0)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;
  
  // Entrance animation
  useEffect(() => {
    if (animateEntrance) {
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 250,
            easing: Easings.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 250,
            easing: Easings.easeOut,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [animateEntrance, delay, opacityAnim, translateYAnim]);
  
  const handlePressIn = () => {
    if (disabled) return;
    
    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    
    // Reduce shadow on press
    Animated.timing(shadowAnim, {
      toValue: 0.5,
      duration: 100,
      useNativeDriver: false,
    }).start();
    
    // Haptic feedback
    if (hapticFeedback && hapticFeedbackEnabled) {
      triggerButtonHaptic();
    }
  };
  
  const handlePressOut = () => {
    if (disabled) return;
    
    // Scale back animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    
    // Restore shadow
    Animated.timing(shadowAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };
  
  const handlePress = () => {
    if (disabled || !onPress) return;
    onPress();
  };
  
  // Interpolate shadow opacity
  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.05, 0.1],
  });
  
  const shadowRadius = shadowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [4, 8],
  });
  
  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
    ],
    opacity: disabled ? 0.5 : opacityAnim,
    shadowOpacity,
    shadowRadius,
  };
  
  const CardWrapper = onPress ? TouchableOpacity : View;
  
  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        },
        animatedStyle,
        style,
      ]}
    >
      <CardWrapper
        onPress={handlePress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        disabled={disabled}
        activeOpacity={1}
        style={styles.cardContent}
      >
        {children}
      </CardWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
});
