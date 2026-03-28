/**
 * AnimatedModal Component
 * ─────────────────────────────────────────────────────────────────
 * Professional modal with smooth slide-up animations and backdrop.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ViewStyle,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Easings } from '../utils/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  backdropOpacity?: number;
  animationDuration?: number;
  position?: 'bottom' | 'center' | 'top';
  avoidKeyboard?: boolean;
}

export default function AnimatedModal({
  visible,
  onClose,
  children,
  style,
  backdropOpacity = 0.5,
  animationDuration = 170,
  position = 'bottom',
  avoidKeyboard = true,
}: AnimatedModalProps) {
  const { theme } = useAppTheme();
  
  // Animation values
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Animate in/out
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: animationDuration,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: animationDuration,
          easing: Easings.easeIn,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: animationDuration,
          easing: Easings.easeIn,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: animationDuration,
          easing: Easings.easeIn,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animationDuration, backdropAnim, slideAnim, scaleAnim]);
  
  // Interpolate backdrop opacity
  const backdropOpacityInterpolation = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, backdropOpacity],
  });
  
  // Get position-specific styles
  const getPositionStyles = (): ViewStyle => {
    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start',
          paddingTop: 60,
        };
      case 'center':
        return {
          justifyContent: 'center',
          alignItems: 'center',
        };
      case 'bottom':
      default:
        return {
          justifyContent: 'flex-end',
        };
    }
  };
  
  const modalContent = (
    <Animated.View
      style={[
        styles.container,
        getPositionStyles(),
        {
          opacity: backdropAnim,
        },
      ]}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.backdropOverlay,
            {
              backgroundColor: '#000',
              opacity: backdropOpacityInterpolation,
            },
          ]}
        />
      </TouchableOpacity>
      
      {/* Modal Content */}
      <Animated.View
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.surface,
            transform: [
              { translateY: slideAnim },
              { scale: position === 'center' ? scaleAnim : 1 },
            ],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
  
  if (avoidKeyboard && Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardAvoidingView}
        >
          {modalContent}
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '85%',
  },
});
