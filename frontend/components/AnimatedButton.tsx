/**
 * AnimatedButton Component
 * ─────────────────────────────────────────────────────────────────
 * Professional button with smooth micro-interactions including
 * scale, opacity, and haptic feedback.
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Text,
} from 'react-native';
import { triggerButtonHaptic } from '../utils/haptics';
import { useAppTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

interface AnimatedButtonProps {
  onPress: () => void;
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
}

export default function AnimatedButton({
  onPress,
  title,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  hapticFeedback = true,
}: AnimatedButtonProps) {
  const { theme } = useAppTheme();
  const { hapticFeedbackEnabled } = useUser();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    if (disabled || loading) return;
    
    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    
    // Slight opacity reduction
    Animated.timing(opacityAnim, {
      toValue: 0.8,
      duration: 80,
      useNativeDriver: true,
    }).start();
    
    // Haptic feedback
    if (hapticFeedback && hapticFeedbackEnabled) {
      triggerButtonHaptic();
    }
  };
  
  const handlePressOut = () => {
    if (disabled || loading) return;
    
    // Scale back animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    
    // Restore opacity
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };
  
  // Get variant styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.primary,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {};
    }
  };
  
  // Get text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };
  
  // Get size styles
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
        };
      case 'medium':
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
        };
      case 'large':
        return {
          paddingHorizontal: 28,
          paddingVertical: 16,
          borderRadius: 16,
        };
      default:
        return {};
    }
  };
  
  // Get text size
  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };
  
  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: disabled ? 0.5 : opacityAnim,
  };
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.button,
          getVariantStyles(),
          getSizeStyles(),
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.loadingDot,
                { backgroundColor: getTextColor() },
              ]}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                { backgroundColor: getTextColor() },
              ]}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                { backgroundColor: getTextColor() },
              ]}
            />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            {title && (
              <Text
                style={[
                  styles.text,
                  {
                    color: getTextColor(),
                    fontSize: getTextSize(),
                    fontWeight: '600',
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
