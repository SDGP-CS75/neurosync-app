/**
 * SkeletonLoader Component
 * ─────────────────────────────────────────────────────────────────
 * Professional skeleton loading animation for content placeholders.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Easings } from '../utils/animations';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'rectangular',
}: SkeletonLoaderProps) {
  const { theme } = useAppTheme();
  
  // Animation value for shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Start shimmer animation
  useEffect(() => {
    const shimmer = Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 800,
        easing: Easings.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0,
        duration: 800,
        easing: Easings.easeInOut,
        useNativeDriver: true,
      }),
    ]);
    
    Animated.loop(shimmer).start();
  }, [shimmerAnim]);
  
  // Interpolate opacity for shimmer effect
  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });
  
  // Get variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          width: width as DimensionValue,
          height: height as DimensionValue,
          borderRadius: borderRadius ?? 4,
        };
      case 'circular':
        const size = typeof width === 'number' ? width : 50;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'rectangular':
      default:
        return {
          width: width as DimensionValue,
          height: height as DimensionValue,
          borderRadius: borderRadius ?? 8,
        };
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        getVariantStyles(),
        style,
      ]}
    />
  );
}

/**
 * SkeletonCard Component
 * ─────────────────────────────────────────────────────────────────
 * Pre-built skeleton for card loading states.
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { theme } = useAppTheme();
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <SkeletonLoader variant="circular" width={40} height={40} />
        <View style={styles.cardHeaderText}>
          <SkeletonLoader variant="text" width="60%" height={16} />
          <SkeletonLoader variant="text" width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonLoader variant="text" width="100%" height={14} style={{ marginTop: 16 }} />
      <SkeletonLoader variant="text" width="80%" height={14} style={{ marginTop: 8 }} />
      <SkeletonLoader variant="text" width="90%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * SkeletonList Component
 * ─────────────────────────────────────────────────────────────────
 * Pre-built skeleton for list loading states.
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  list: {
    width: '100%',
  },
});
