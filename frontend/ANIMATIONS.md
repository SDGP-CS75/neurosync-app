# Animation System Documentation

## Overview

This animation system provides professional-grade animations for the NeuroSync app, featuring smooth easing functions, micro-interactions, and performance-optimized components.

## Architecture

### Core Components

1. **Animation Utilities** (`utils/animations.ts`)
   - Custom easing functions
   - Reusable animation hooks
   - Animation presets
   - Helper functions

2. **Animated Components**
   - `AnimatedButton` - Buttons with press animations
   - `AnimatedCard` - Cards with entrance and press animations
   - `AnimatedList` - Lists with staggered entrance
   - `AnimatedProgressBar` - Progress bars with spring physics
   - `AnimatedModal` - Modals with smooth slide animations
   - `AnimatedNavBar` - Navigation bar with icon transitions
   - `SkeletonLoader` - Loading placeholders with shimmer effect

## Usage Examples

### AnimatedButton

```tsx
import { AnimatedButton } from './components/animations';

// Primary button
<AnimatedButton
  title="Save Task"
  onPress={() => console.log('Pressed')}
  variant="primary"
  size="medium"
/>

// With icon
<AnimatedButton
  title="Add Task"
  onPress={() => console.log('Pressed')}
  variant="primary"
  icon={<Ionicons name="add" size={20} color="#fff" />}
  iconPosition="left"
/>

// Outline variant
<AnimatedButton
  title="Cancel"
  onPress={() => console.log('Pressed')}
  variant="outline"
  size="small"
/>
```

### AnimatedCard

```tsx
import { AnimatedCard } from './components/animations';

// Basic card
<AnimatedCard onPress={() => console.log('Card pressed')}>
  <Text>Card Content</Text>
</AnimatedCard>

// With entrance animation delay
<AnimatedCard
  onPress={() => console.log('Pressed')}
  delay={100}
  pressScale={0.97}
>
  <Text>Delayed entrance</Text>
</AnimatedCard>

// Disabled state
<AnimatedCard disabled>
  <Text>Disabled card</Text>
</AnimatedCard>
```

### AnimatedList

```tsx
import { AnimatedList } from './components/animations';

const data = [
  { id: 1, title: 'Task 1' },
  { id: 2, title: 'Task 2' },
  { id: 3, title: 'Task 3' },
];

<AnimatedList
  data={data}
  renderItem={(item, index) => (
    <AnimatedCard key={item.id}>
      <Text>{item.title}</Text>
    </AnimatedCard>
  )}
  staggerDelay={50}
  animationDuration={300}
/>
```

### AnimatedProgressBar

```tsx
import { AnimatedProgressBar } from './components/animations';

// Basic progress bar
<AnimatedProgressBar progress={75} />

// Custom styling
<AnimatedProgressBar
  progress={50}
  height={12}
  progressColor="#8B5CF6"
  backgroundColor="#E0E0E0"
  showPercentage
  animated
  duration={800}
/>
```

### AnimatedModal

```tsx
import { AnimatedModal } from './components/animations';

const [visible, setVisible] = useState(false);

<AnimatedModal
  visible={visible}
  onClose={() => setVisible(false)}
  position="bottom"
  backdropOpacity={0.5}
>
  <View style={{ padding: 20 }}>
    <Text>Modal Content</Text>
  </View>
</AnimatedModal>
```

### AnimatedNavBar

```tsx
import { AnimatedNavBar } from './components/animations';

const navItems = [
  { key: 'home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'focus', icon: 'bulb-outline', activeIcon: 'bulb' },
  { key: 'profile', icon: 'person-outline', activeIcon: 'person' },
];

<AnimatedNavBar
  items={navItems}
  activeKey="home"
  onItemPress={(key) => console.log('Pressed:', key)}
  showLabels
/>
```

### SkeletonLoader

```tsx
import { SkeletonLoader, SkeletonCard, SkeletonList } from './components/animations';

// Text skeleton
<SkeletonLoader variant="text" width="80%" height={16} />

// Circular skeleton (avatar)
<SkeletonLoader variant="circular" width={50} height={50} />

// Rectangular skeleton
<SkeletonLoader variant="rectangular" width="100%" height={120} />

// Pre-built card skeleton
<SkeletonCard />

// Pre-built list skeleton
<SkeletonList count={3} />
```

## Animation Hooks

### usePressAnimation

```tsx
import { usePressAnimation } from './utils/animations';

function MyComponent() {
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(0.95);
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text>Press me</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
```

### useFadeIn

```tsx
import { useFadeIn } from './utils/animations';

function MyComponent() {
  const fadeAnim = useFadeIn(300, 100); // duration, delay
  
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text>Fades in on mount</Text>
    </Animated.View>
  );
}
```

### useSlideUp

```tsx
import { useSlideUp } from './utils/animations';

function MyComponent() {
  const { slideAnim, fadeAnim } = useSlideUp(300, 0, 30);
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text>Slides up on mount</Text>
    </Animated.View>
  );
}
```

### useStaggerAnimation

```tsx
import { useStaggerAnimation } from './utils/animations';

function MyComponent() {
  const items = ['Item 1', 'Item 2', 'Item 3'];
  const animations = useStaggerAnimation(items.length, 50);
  
  return (
    <View>
      {items.map((item, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: animations[index].opacity,
            transform: [{ translateY: animations[index].translateY }],
          }}
        >
          <Text>{item}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
```

### usePulseAnimation

```tsx
import { usePulseAnimation } from './utils/animations';

function MyComponent() {
  const pulseAnim = usePulseAnimation(0.98, 1.02);
  
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Text>Pulsing animation</Text>
    </Animated.View>
  );
}
```

### useShakeAnimation

```tsx
import { useShakeAnimation } from './utils/animations';

function MyComponent() {
  const { shakeAnim, triggerShake } = useShakeAnimation();
  
  return (
    <View>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <Text>Shakeable</Text>
      </Animated.View>
      <Button onPress={triggerShake} title="Shake" />
    </View>
  );
}
```

## Easing Functions

The animation system provides custom easing functions for different use cases:

```tsx
import { Easings } from './utils/animations';

// Smooth ease-out for entrances
Easings.easeOut

// Smooth ease-in for exits
Easings.easeIn

// Smooth ease-in-out for transitions
Easings.easeInOut

// Spring-like bounce for playful interactions
Easings.bounce

// Subtle spring for micro-interactions
Easings.spring

// Sharp ease for quick feedback
Easings.sharp

// Standard material design
Easings.standard

// Decelerate for page transitions
Easings.decelerate

// Accelerate for exits
Easings.accelerate
```

## Animation Presets

Pre-configured animation settings for common use cases:

```tsx
import { AnimationPresets } from './utils/animations';

// Button press animation
AnimationPresets.buttonPress

// Card entrance animation
AnimationPresets.cardEntrance

// Page transition
AnimationPresets.pageTransition

// Modal animation
AnimationPresets.modal

// List item stagger
AnimationPresets.listItem

// Progress animation
AnimationPresets.progress

// Fade animation
AnimationPresets.fade

// Scale animation
AnimationPresets.scale
```

## Performance Considerations

### Native Driver

All animations use `useNativeDriver: true` whenever possible for 60fps performance. Only animations that modify layout properties (like `width`, `height`) use the JavaScript thread.

### Accessibility

The system respects user preferences for reduced motion:

```tsx
import { shouldReduceMotion } from './utils/animations';

const reduceMotion = await shouldReduceMotion();
if (reduceMotion) {
  // Skip animations or use minimal transitions
}
```

### Haptic Feedback

Haptic feedback is integrated with user preferences:

```tsx
import { triggerButtonHaptic } from './utils/haptics';

// Only triggers if user has enabled haptic feedback
if (hapticFeedbackEnabled) {
  triggerButtonHaptic();
}
```

## Best Practices

1. **Use appropriate easing functions**
   - `easeOut` for entrances
   - `easeIn` for exits
   - `spring` for playful interactions
   - `sharp` for quick feedback

2. **Keep animations subtle**
   - Duration: 120-300ms for most interactions
   - Scale: 0.95-0.98 for press animations
   - Distance: 10-20px for slide animations

3. **Provide haptic feedback**
   - Light impact for button presses
   - Medium impact for navigation
   - Success/error notifications for important actions

4. **Respect accessibility**
   - Check for reduced motion preferences
   - Provide alternative feedback when animations are disabled
   - Ensure animations don't cause motion sickness

5. **Optimize performance**
   - Use native driver whenever possible
   - Avoid animating layout properties
   - Batch animations with `Animated.parallel`
   - Use `Animated.stagger` for sequential animations

## Integration Guide

To integrate animations into existing components:

1. Import the animation component or hook
2. Replace static components with animated versions
3. Add haptic feedback where appropriate
4. Test on both iOS and Android
5. Verify performance with React Native Debugger

Example:

```tsx
// Before
<TouchableOpacity onPress={handlePress}>
  <Text>Press me</Text>
</TouchableOpacity>

// After
import { AnimatedButton } from './components/animations';

<AnimatedButton
  title="Press me"
  onPress={handlePress}
  variant="primary"
/>
```

## Troubleshooting

### Animations not smooth

- Ensure `useNativeDriver: true` is set
- Check for layout thrashing
- Profile with React Native Performance Monitor

### Haptic feedback not working

- Verify user has enabled haptic feedback
- Check device capabilities
- Test on physical device (simulator may not support haptics)

### Animations not triggering

- Check animation values are being updated
- Verify `useNativeDriver` is compatible with animated properties
- Ensure component is mounted before starting animations

## Future Enhancements

- [ ] Add gesture-based animations (swipe, drag)
- [ ] Implement shared element transitions
- [ ] Add Lottie animation integration
- [ ] Create animation builder for custom sequences
- [ ] Add animation presets for common patterns
- [ ] Implement animation performance monitoring
