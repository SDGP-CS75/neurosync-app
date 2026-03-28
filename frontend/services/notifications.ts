/**
 * Notification Service
 * Handles scheduling, canceling, and managing task reminders
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationOptions {
  sound?: 'default' | 'gentle' | 'urgent' | 'none';
  vibration?: 'default' | 'light' | 'heavy' | 'none';
  priority?: 'default' | 'high' | 'low';
}

export interface RecurringOptions {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  maxOccurrences?: number;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  reminder?: string;
  reminderSound?: 'default' | 'gentle' | 'urgent' | 'none';
  reminderVibration?: 'default' | 'light' | 'heavy' | 'none';
  reminderPriority?: 'default' | 'high' | 'low';
  recurringReminder?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    maxOccurrences?: number;
  };
}

// ─── Configuration ────────────────────────────────────────────────────────────

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get notification identifier for a task
 */
function getNotificationId(taskId: string, occurrence?: number): string {
  return occurrence !== undefined
    ? `task-reminder-${taskId}-${occurrence}`
    : `task-reminder-${taskId}`;
}

/**
 * Parse reminder string to minutes
 */
function parseReminderMinutes(reminder: string): number {
  const parsed = parseInt(reminder, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate notification trigger time
 */
function calculateTriggerTime(dueDate: string, reminderMinutes: number): Date {
  const due = new Date(dueDate);
  const triggerTime = new Date(due.getTime() - reminderMinutes * 60 * 1000);
  return triggerTime;
}

/**
 * Check if trigger time is in the past
 */
function isTriggerTimeInPast(triggerTime: Date): boolean {
  return triggerTime.getTime() <= Date.now();
}

/**
 * Get sound based on option
 */
function getSound(option?: 'default' | 'gentle' | 'urgent' | 'none'): string | undefined {
  switch (option) {
    case 'gentle':
      return 'gentle.wav'; // Custom sound file (to be added)
    case 'urgent':
      return 'urgent.wav'; // Custom sound file (to be added)
    case 'none':
      return undefined;
    case 'default':
    default:
      return 'default';
  }
}

/**
 * Get vibration pattern based on option
 */
function getVibrationPattern(option?: 'default' | 'light' | 'heavy' | 'none'): number[] | undefined {
  switch (option) {
    case 'light':
      return [0, 250]; // Short vibration
    case 'heavy':
      return [0, 500, 200, 500]; // Long vibration with pause
    case 'none':
      return [];
    case 'default':
    default:
      return [0, 250, 250, 250]; // Default pattern
  }
}

/**
 * Get notification priority based on option
 */
function getPriority(option?: 'default' | 'high' | 'low'): Notifications.AndroidNotificationPriority {
  switch (option) {
    case 'high':
      return Notifications.AndroidNotificationPriority.HIGH;
    case 'low':
      return Notifications.AndroidNotificationPriority.LOW;
    case 'default':
    default:
      return Notifications.AndroidNotificationPriority.DEFAULT;
  }
}

/**
 * Calculate next occurrence for recurring reminder
 */
function calculateNextOccurrence(
  baseDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number,
  occurrenceNumber: number
): Date {
  const nextDate = new Date(baseDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval * occurrenceNumber);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval * occurrenceNumber);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval * occurrenceNumber);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval * occurrenceNumber);
      break;
  }
  
  return nextDate;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notifications require a physical device');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get notification permission status
 */
export async function getNotificationStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  } catch (error) {
    console.error('Error getting notification status:', error);
    return { granted: false, canAskAgain: false };
  }
}

/**
 * Schedule a single notification for a task
 */
export async function scheduleTaskNotification(
  task: Task,
  options?: NotificationOptions
): Promise<string | null> {
  if (!task.reminder || !task.dueDate) {
    console.warn('Cannot schedule notification: missing reminder or dueDate');
    return null;
  }

  const reminderMinutes = parseReminderMinutes(task.reminder);
  const triggerTime = calculateTriggerTime(task.dueDate, reminderMinutes);

  if (isTriggerTimeInPast(triggerTime)) {
    console.warn('Cannot schedule notification: trigger time is in the past');
    return null;
  }

  try {
    const notificationId = getNotificationId(task.id);
    
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: task.title,
        body: `Reminder: ${task.title} is due ${formatDueTime(task.dueDate)}`,
        data: {
          taskId: task.id,
          type: 'task-reminder',
        },
        sound: getSound(options?.sound ?? task.reminderSound),
        vibrate: getVibrationPattern(options?.vibration ?? task.reminderVibration),
        priority: getPriority(options?.priority ?? task.reminderPriority),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
      },
    });

    console.log(`Scheduled notification ${notificationId} for ${triggerTime.toISOString()}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule recurring notifications for a task
 */
export async function scheduleRecurringNotification(
  task: Task,
  recurringOptions: RecurringOptions,
  notificationOptions?: NotificationOptions
): Promise<string[] | null> {
  if (!task.reminder || !task.dueDate) {
    console.warn('Cannot schedule recurring notification: missing reminder or dueDate');
    return null;
  }

  const reminderMinutes = parseReminderMinutes(task.reminder);
  const baseDueDate = new Date(task.dueDate);
  const notificationIds: string[] = [];

  // Calculate max occurrences
  let maxOccurrences = recurringOptions.maxOccurrences ?? 365;
  if (recurringOptions.endDate) {
    const endDate = new Date(recurringOptions.endDate);
    let count = 0;
    let currentDate = baseDueDate;
    
    while (currentDate <= endDate && count < maxOccurrences) {
      count++;
      currentDate = calculateNextOccurrence(
        baseDueDate,
        recurringOptions.frequency,
        recurringOptions.interval,
        count
      );
    }
    maxOccurrences = Math.min(maxOccurrences, count);
  }

  // Schedule notifications for each occurrence
  for (let i = 0; i < maxOccurrences; i++) {
    const occurrenceDueDate = calculateNextOccurrence(
      baseDueDate,
      recurringOptions.frequency,
      recurringOptions.interval,
      i
    );
    
    const triggerTime = calculateTriggerTime(
      occurrenceDueDate.toISOString(),
      reminderMinutes
    );

    if (isTriggerTimeInPast(triggerTime)) {
      continue; // Skip past occurrences
    }

    try {
      const notificationId = getNotificationId(task.id, i);
      
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: task.title,
          body: `Reminder: ${task.title} is due ${formatDueTime(occurrenceDueDate.toISOString())}`,
          data: {
            taskId: task.id,
            type: 'task-reminder',
            occurrence: i,
          },
          sound: getSound(notificationOptions?.sound ?? task.reminderSound),
          vibrate: getVibrationPattern(notificationOptions?.vibration ?? task.reminderVibration),
          priority: getPriority(notificationOptions?.priority ?? task.reminderPriority),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
          channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
        },
      });

      notificationIds.push(notificationId);
      console.log(`Scheduled recurring notification ${notificationId} for ${triggerTime.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling recurring notification ${i}:`, error);
    }
  }

  return notificationIds.length > 0 ? notificationIds : null;
}

/**
 * Cancel notification for a task
 */
export async function cancelTaskNotification(taskId: string): Promise<void> {
  try {
    // Cancel single notification
    const singleId = getNotificationId(taskId);
    await Notifications.cancelScheduledNotificationAsync(singleId);
    console.log(`Cancelled notification ${singleId}`);

    // Cancel recurring notifications (up to 365 occurrences)
    for (let i = 0; i < 365; i++) {
      const recurringId = getNotificationId(taskId, i);
      try {
        await Notifications.cancelScheduledNotificationAsync(recurringId);
      } catch {
        // Notification doesn't exist, continue
        break;
      }
    }
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all scheduled notifications');
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Format due time for display
 */
function formatDueTime(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (date.toDateString() === now.toDateString()) {
    return `today at ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `tomorrow at ${timeStr}`;
  } else {
    return `on ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} at ${timeStr}`;
  }
}
