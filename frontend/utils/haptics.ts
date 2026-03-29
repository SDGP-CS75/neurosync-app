/**
 * Haptic Feedback Utility
 * Provides haptic feedback functionality that respects user preferences
 */

import * as Haptics from 'expo-haptics';

/**
 * Trigger haptic feedback for navigation
 * Uses medium impact for navigation actions
 */
export async function triggerNavigationHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently fail if haptics are not available
    console.log('Haptic feedback not available:', error);
  }
}

/**
 * Trigger haptic feedback for button presses
 * Uses light impact for button interactions
 */
export async function triggerButtonHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail if haptics are not available
    console.log('Haptic feedback not available:', error);
  }
}

/**
 * Trigger haptic feedback for success actions
 * Uses success notification type
 */
export async function triggerSuccessHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Silently fail if haptics are not available
    console.log('Haptic feedback not available:', error);
  }
}

/**
 * Trigger haptic feedback for error actions
 * Uses error notification type
 */
export async function triggerErrorHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Silently fail if haptics are not available
    console.log('Haptic feedback not available:', error);
  }
}

/**
 * Trigger haptic feedback for selection changes
 * Uses selection feedback type
 */
export async function triggerSelectionHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Silently fail if haptics are not available
    console.log('Haptic feedback not available:', error);
  }
}
