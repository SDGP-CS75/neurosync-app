/**
 * AnimatedProgressBar Component
 * ─────────────────────────────────────────────────────────────────
 * Professional progress bar with smooth spring animations and
 * customizable styling.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Easings } from '../utils/animations';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  duration?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export default function AnimatedProgressBar({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  showPercentage = false,
  animated = true,
  duration = 170,
  style,
  borderRadius,
}: AnimatedProgressBarProps) {
  const { theme } = useAppTheme();
  
  // Animation value
  const widthAnim = useRef(new Animated.Value(0)).current;
  
  // Animate progress change
  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: progress,
        duration,
        easing: Easings.easeInOut,
        useNativeDriver: false, // width changes can't use native driver
      }).start();
    } else {
      widthAnim.setValue(progress);
    }
  }, [progress, animated, duration, widthAnim]);
  
  // Interpolate width
  const widthInterpolation = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });
  
  const bgColor = backgroundColor || theme.colors.surfaceVariant;
  const fillColor = progressColor || theme.colors.primary;
  const radius = borderRadius ?? height / 2;
  
  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: bgColor,
            borderRadius: radius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: fillColor,
              borderRadius: radius,
              width: widthInterpolation,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.percentage, { color: theme.colors.text }]}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
});
