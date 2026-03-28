/**
 * AnimatedNavBar Component
 * ─────────────────────────────────────────────────────────────────
 * Professional navigation bar with smooth icon transitions and
 * active state animations.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { triggerNavigationHaptic } from '../utils/haptics';
import { useUser } from '../context/UserContext';
import { Easings } from '../utils/animations';

interface NavItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  label?: string;
}

interface AnimatedNavBarProps {
  items: NavItem[];
  activeKey: string;
  onItemPress: (key: string) => void;
  style?: ViewStyle;
  showLabels?: boolean;
}

export default function AnimatedNavBar({
  items,
  activeKey,
  onItemPress,
  style,
  showLabels = false,
}: AnimatedNavBarProps) {
  const { theme } = useAppTheme();
  const { hapticFeedbackEnabled } = useUser();
  
  // Create animation values for each item
  const itemAnimations = useRef(
    items.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.6),
      translateY: new Animated.Value(0),
    }))
  ).current;
  
  // Animate active item
  useEffect(() => {
    items.forEach((item, index) => {
      const anim = itemAnimations[index];
      const isActive = item.key === activeKey;
      
      Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: isActive ? 1.1 : 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }),
        Animated.timing(anim.opacity, {
          toValue: isActive ? 1 : 0.6,
          duration: 150,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: isActive ? -4 : 0,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }),
      ]).start();
    });
  }, [activeKey, items, itemAnimations]);
  
  const handleItemPress = (key: string, index: number) => {
    // Haptic feedback
    if (hapticFeedbackEnabled) {
      triggerNavigationHaptic();
    }
    
    // Bounce animation on press
    const anim = itemAnimations[index];
    Animated.sequence([
      Animated.spring(anim.scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(anim.scale, {
        toValue: activeKey === key ? 1.1 : 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
    ]).start();
    
    onItemPress(key);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
      {items.map((item, index) => {
        const anim = itemAnimations[index];
        const isActive = item.key === activeKey;
        const iconName = isActive && item.activeIcon ? item.activeIcon : item.icon;
        
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => handleItemPress(item.key, index)}
            activeOpacity={0.7}
            style={styles.item}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    { scale: anim.scale },
                    { translateY: anim.translateY },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            >
              <View
                style={[
                  styles.iconBackground,
                  isActive && {
                    backgroundColor: theme.colors.primary + '20',
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isActive ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>
              {showLabels && item.label && (
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.textMuted,
                      opacity: anim.opacity,
                    },
                  ]}
                >
                  {item.label}
                </Animated.Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
