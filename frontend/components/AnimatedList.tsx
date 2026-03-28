/**
 * AnimatedList Component
 * ─────────────────────────────────────────────────────────────────
 * Professional list with staggered entrance animations for items.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  FlatListProps,
  FlatList,
} from 'react-native';
import { Easings } from '../utils/animations';

interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  staggerDelay?: number;
  animationDuration?: number;
  containerStyle?: ViewStyle;
  itemStyle?: ViewStyle;
}

export default function AnimatedList<T>({
  data,
  renderItem,
  staggerDelay = 40,
  animationDuration = 170,
  containerStyle,
  itemStyle,
  ...flatListProps
}: AnimatedListProps<T>) {
  // Create animation values for each item
  const animations = useRef(
    data.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;
  
  // Update animations when data changes
  useEffect(() => {
    // Reset animations for new items
    if (animations.length < data.length) {
      const newAnimations = Array.from(
        { length: data.length - animations.length },
        () => ({
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(20),
        })
      );
      animations.push(...newAnimations);
    }
    
    // Animate all items
    const staggeredAnimations = animations.slice(0, data.length).map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: animationDuration,
          delay: index * staggerDelay,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: animationDuration,
          delay: index * staggerDelay,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ])
    );
    
    Animated.stagger(staggerDelay, staggeredAnimations).start();
  }, [data.length, animations, staggerDelay, animationDuration]);
  
  const renderAnimatedItem = ({ item, index }: { item: T; index: number }) => {
    const anim = animations[index] || {
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
    };
    
    return (
      <Animated.View
        style={[
          styles.item,
          {
            opacity: anim.opacity,
            transform: [{ translateY: anim.translateY }],
          },
          itemStyle,
        ]}
      >
        {renderItem(item, index)}
      </Animated.View>
    );
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList
        data={data}
        renderItem={renderAnimatedItem}
        keyExtractor={(_, index) => index.toString()}
        {...flatListProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    // Default item styles
  },
});
