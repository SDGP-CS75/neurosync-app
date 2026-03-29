/**
 * Animation Utilities
 * ─────────────────────────────────────────────────────────────────
 * Professional-grade animation system with custom easing functions,
 * reusable hooks, and performance-optimized presets.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
} from 'react-native';

// ─────────────────────────────────────────────────────────────────
// EASING FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Custom easing curves for professional feel
 */
export const Easings = {
  // Smooth ease-out for entrances
  easeOut: Easing.out(Easing.cubic),
  
  // Smooth ease-in for exits
  easeIn: Easing.in(Easing.cubic),
  
  // Smooth ease-in-out for transitions
  easeInOut: Easing.inOut(Easing.cubic),
  
  // Spring-like bounce for playful interactions
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  
  // Subtle spring for micro-interactions
  spring: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  
  // Sharp ease for quick feedback
  sharp: Easing.bezier(0.4, 0, 0.2, 1),
  
  // Standard material design
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  
  // Decelerate for page transitions
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  
  // Accelerate for exits
  accelerate: Easing.bezier(0.4, 0, 1, 1),
};

// ─────────────────────────────────────────────────────────────────
// ANIMATION PRESETS
// ─────────────────────────────────────────────────────────────────

/**
 * Pre-configured animation settings for common use cases
 * All animations use consistent timing for uniform feel across pages
 */
export const AnimationPresets = {
  // Button press animation
  buttonPress: {
    duration: 120,
    easing: Easings.sharp,
    useNativeDriver: true,
  },
  
  // Card entrance animation
  cardEntrance: {
    duration: 170,
    easing: Easings.easeOut,
    useNativeDriver: true,
  },
  
  // Page transition
  pageTransition: {
    duration: 170,
    easing: Easings.decelerate,
    useNativeDriver: true,
  },
  
  // Modal animation
  modal: {
    duration: 170,
    easing: Easings.easeOut,
    useNativeDriver: true,
  },
  
  // List item stagger
  listItem: {
    duration: 170,
    easing: Easings.easeOut,
    useNativeDriver: true,
  },
  
  // Progress animation
  progress: {
    duration: 170,
    easing: Easings.easeInOut,
    useNativeDriver: false, // width changes can't use native driver
  },
  
  // Fade animation
  fade: {
    duration: 150,
    easing: Easings.easeInOut,
    useNativeDriver: true,
  },
  
  // Scale animation
  scale: {
    duration: 150,
    easing: Easings.spring,
    useNativeDriver: true,
  },
};

// ─────────────────────────────────────────────────────────────────
// ANIMATION HOOKS
// ─────────────────────────────────────────────────────────────────

/**
 * Hook for press animations (scale down on press)
 */
export function usePressAnimation(scaleValue: number = 0.95) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  
  return { scaleAnim, onPressIn, onPressOut };
}

/**
 * Hook for fade-in animations
 */
export function useFadeIn(duration: number = 170, delay: number = 0) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);
  
  useEffect(() => {
    shouldReduceMotion().then(enabled => {
      reduceMotionRef.current = enabled;
    });
  }, []);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (reduceMotionRef.current) {
        fadeAnim.setValue(1);
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }).start();
      }
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [fadeAnim, duration, delay]);
  
  return fadeAnim;
}

/**
 * Hook for slide-up animations
 */
export function useSlideUp(duration: number = 170, delay: number = 0, distance: number = 20) {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);
  
  useEffect(() => {
    shouldReduceMotion().then(enabled => {
      reduceMotionRef.current = enabled;
    });
  }, []);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (reduceMotionRef.current) {
        slideAnim.setValue(0);
        fadeAnim.setValue(1);
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            easing: Easings.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            easing: Easings.easeOut,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [slideAnim, fadeAnim, duration, delay, distance]);
  
  return { slideAnim, fadeAnim };
}

/**
 * Hook for staggered list animations
 */
export function useStaggerAnimation(itemCount: number, staggerDelay: number = 40) {
  const animations = useRef(
    Array.from({ length: itemCount }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;
  const reduceMotionRef = useRef(false);
  
  useEffect(() => {
    shouldReduceMotion().then(enabled => {
      reduceMotionRef.current = enabled;
    });
  }, []);
  
  useEffect(() => {
    if (reduceMotionRef.current) {
      animations.forEach(anim => {
        anim.opacity.setValue(1);
        anim.translateY.setValue(0);
      });
    } else {
      const staggeredAnimations = animations.map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 170,
            delay: index * staggerDelay,
            easing: Easings.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 170,
            delay: index * staggerDelay,
            easing: Easings.easeOut,
            useNativeDriver: true,
          }),
        ])
      );
      
      Animated.stagger(staggerDelay, staggeredAnimations).start();
    }
  }, [animations, staggerDelay]);
  
  return animations;
}

/**
 * Hook for pulse animation (attention grabber)
 */
export function usePulseAnimation(scaleMin: number = 0.98, scaleMax: number = 1.02) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: scaleMax,
        duration: 800,
        easing: Easings.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: scaleMin,
        duration: 800,
        easing: Easings.easeInOut,
        useNativeDriver: true,
      }),
    ]);
    
    Animated.loop(pulse).start();
  }, [pulseAnim, scaleMin, scaleMax]);
  
  return pulseAnim;
}

/**
 * Hook for shake animation (error feedback)
 */
export function useShakeAnimation() {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  return { shakeAnim, triggerShake };
}

/**
 * Hook for progress animation with spring physics
 */
export function useProgressAnimation(targetValue: number, duration: number = 170) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);
  
  useEffect(() => {
    shouldReduceMotion().then(enabled => {
      reduceMotionRef.current = enabled;
    });
  }, []);
  
  useEffect(() => {
    if (reduceMotionRef.current) {
      progressAnim.setValue(targetValue);
    } else {
      Animated.timing(progressAnim, {
        toValue: targetValue,
        duration,
        easing: Easings.easeInOut,
        useNativeDriver: false,
      }).start();
    }
  }, [progressAnim, targetValue, duration]);
  
  return progressAnim;
}

/**
 * Hook for rotation animation
 */
export function useRotationAnimation(duration: number = 1000, continuous: boolean = true) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const rotation = Animated.timing(rotateAnim, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    
    if (continuous) {
      Animated.loop(rotation).start();
    } else {
      rotation.start();
    }
  }, [rotateAnim, duration, continuous]);
  
  return rotateAnim;
}

// ─────────────────────────────────────────────────────────────────
// ANIMATION UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Check if animations should be reduced (accessibility)
 */
export async function shouldReduceMotion(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return AccessibilityInfo.isReduceMotionEnabled();
  }
  return false;
}

/**
 * Create a spring animation config
 */
export function createSpringConfig(
  stiffness: number = 100,
  damping: number = 10,
  mass: number = 1,
  overshootClamping: boolean = false
) {
  return {
    stiffness,
    damping,
    mass,
    overshootClamping,
    useNativeDriver: true,
  };
}

/**
 * Create a timing animation config
 */
export function createTimingConfig(
  duration: number = 200,
  easing: (value: number) => number = Easings.easeOut,
  useNativeDriver: boolean = true
) {
  return {
    duration,
    easing,
    useNativeDriver,
  };
}

/**
 * Compose multiple animations in parallel
 */
export function parallelAnimations(animations: Animated.CompositeAnimation[]) {
  return Animated.parallel(animations);
}

/**
 * Compose multiple animations in sequence
 */
export function sequenceAnimations(animations: Animated.CompositeAnimation[]) {
  return Animated.sequence(animations);
}

/**
 * Stagger multiple animations
 */
export function staggerAnimations(
  delay: number,
  animations: Animated.CompositeAnimation[]
) {
  return Animated.stagger(delay, animations);
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT ANIMATION HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Create button press animation
 */
export function createButtonPressAnimation(scaleAnim: Animated.Value) {
  return {
    onPressIn: () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    },
  };
}

/**
 * Create card entrance animation
 */
export function createCardEntranceAnimation(
  opacityAnim: Animated.Value,
  translateYAnim: Animated.Value,
  delay: number = 0
) {
  return Animated.parallel([
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 170,
      delay,
      easing: Easings.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(translateYAnim, {
      toValue: 0,
      duration: 170,
      delay,
      easing: Easings.easeOut,
      useNativeDriver: true,
    }),
  ]);
}

/**
 * Create modal slide animation
 */
export function createModalSlideAnimation(
  translateYAnim: Animated.Value,
  show: boolean
) {
  return Animated.timing(translateYAnim, {
    toValue: show ? 0 : 1000,
    duration: 170,
    easing: show ? Easings.easeOut : Easings.easeIn,
    useNativeDriver: true,
  });
}

/**
 * Create fade transition
 */
export function createFadeTransition(
  opacityAnim: Animated.Value,
  show: boolean,
  duration: number = 150
) {
  return Animated.timing(opacityAnim, {
    toValue: show ? 1 : 0,
    duration,
    easing: Easings.easeInOut,
    useNativeDriver: true,
  });
}

/**
 * Create scale transition
 */
export function createScaleTransition(
  scaleAnim: Animated.Value,
  show: boolean,
  duration: number = 150
) {
  return Animated.spring(scaleAnim, {
    toValue: show ? 1 : 0.9,
    useNativeDriver: true,
    speed: 50,
    bounciness: 4,
  });
}
