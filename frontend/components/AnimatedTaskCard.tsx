/**
 * AnimatedTaskCard Component
 * ─────────────────────────────────────────────────────────────────
 * Animated task card with staggered entrance animation and press micro-interactions.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Easings } from '../utils/animations';

interface AnimatedTaskCardProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
  style?: ViewStyle;
  delay?: number;
}

export default function AnimatedTaskCard({
  children,
  index,
  onPress,
  style,
  delay = 0,
}: AnimatedTaskCardProps) {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Staggered entrance animation
  useEffect(() => {
    const staggerDelay = delay + (index * 50); // 50ms stagger per item
    
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 170,
        delay: staggerDelay,
        easing: Easings.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 170,
        delay: staggerDelay,
        easing: Easings.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delay, opacityAnim, translateYAnim]);
  
  // Press animation handlers
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    
    // Light haptic feedback on press
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  
  const animatedStyle = {
    opacity: opacityAnim,
    transform: [
      { translateY: translateYAnim },
      { scale: scaleAnim },
    ],
  };
  
  if (onPress) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity 
          onPress={onPress} 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Default styles
  },
});
