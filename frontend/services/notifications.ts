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
  status?: 'done' | 'in-progress' | 'todo';
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
 * Handles timezone issues by ensuring consistent UTC-based calculations
 */
function calculateTriggerTime(dueDate: string, reminderMinutes: number): Date {
  // Parse the due date - this will be in the user's local timezone
  const due = new Date(dueDate);
  
  // Calculate trigger time by subtracting reminder minutes
  const triggerTime = new Date(due.getTime() - reminderMinutes * 60 * 1000);
  
  // Ensure we're working with a valid date
  if (isNaN(triggerTime.getTime())) {
    console.error('Invalid trigger time calculated for dueDate:', dueDate, 'reminderMinutes:', reminderMinutes);
    return new Date(); // Return current time as fallback
  }
  
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
    console.warn('Cannot schedule notification: trigger time is in the past', {
      taskId: task.id,
      taskTitle: task.title,
      dueDate: task.dueDate,
      reminderMinutes,
      triggerTime: triggerTime.toISOString(),
      currentTime: new Date().toISOString(),
    });
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
    console.error('Error scheduling notification:', {
      error,
      taskId: task.id,
      taskTitle: task.title,
      dueDate: task.dueDate,
      reminderMinutes,
      triggerTime: triggerTime.toISOString(),
    });
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
      console.error(`Error scheduling recurring notification ${i}:`, {
        error,
        taskId: task.id,
        taskTitle: task.title,
        occurrence: i,
        occurrenceDueDate: occurrenceDueDate.toISOString(),
        triggerTime: triggerTime.toISOString(),
      });
    }
  }

  return notificationIds.length > 0 ? notificationIds : null;
}

/**
 * Cancel notification for a task
 * Properly cancels all notifications including recurring ones
 */
export async function cancelTaskNotification(taskId: string): Promise<void> {
  try {
    // Cancel single notification
    const singleId = getNotificationId(taskId);
    try {
      await Notifications.cancelScheduledNotificationAsync(singleId);
      console.log(`Cancelled notification ${singleId}`);
    } catch (error) {
      // Notification might not exist, that's okay
      console.log(`Notification ${singleId} not found or already cancelled`);
    }

    // Cancel recurring notifications (up to 365 occurrences)
    // Don't break on first error - continue trying to cancel all
    for (let i = 0; i < 365; i++) {
      const recurringId = getNotificationId(taskId, i);
      try {
        await Notifications.cancelScheduledNotificationAsync(recurringId);
        console.log(`Cancelled recurring notification ${recurringId}`);
      } catch (error) {
        // Notification doesn't exist, continue to next one
        // Don't break - there might be gaps in the sequence
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

// ─── Streak & Motivation Functions ───────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

/**
 * Schedule a motivational notification based on streak
 */
export async function scheduleMotivationalNotification(
  streakData: StreakData,
  options?: NotificationOptions
): Promise<string | null> {
  const motivationalMessages = [
    { threshold: 7, message: "🔥 You're on a 7-day streak! Keep the momentum going!" },
    { threshold: 14, message: "🌟 Two weeks strong! You're building amazing habits!" },
    { threshold: 21, message: "💎 21 days! You're forming a lasting routine!" },
    { threshold: 30, message: "🏆 One month streak! You're unstoppable!" },
    { threshold: 50, message: "🚀 50 days! You're a productivity machine!" },
    { threshold: 100, message: "💯 100 days! Legendary status achieved!" },
  ];

  const matchingMessage = motivationalMessages
    .filter(m => streakData.currentStreak >= m.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0];

  if (!matchingMessage) {
    return null;
  }

  try {
    const notificationId = `streak-motivation-${Date.now()}`;
    const triggerTime = new Date();
    triggerTime.setHours(triggerTime.getHours() + 1); // Schedule 1 hour from now

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: "Streak Achievement! 🎉",
        body: matchingMessage.message,
        data: {
          type: 'streak-motivation',
          streak: streakData.currentStreak,
        },
        sound: getSound(options?.sound ?? 'default'),
        vibrate: getVibrationPattern(options?.vibration ?? 'default'),
        priority: getPriority(options?.priority ?? 'high'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
      },
    });

    console.log(`Scheduled motivational notification ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling motivational notification:', error);
    return null;
  }
}

/**
 * Schedule a daily streak reminder notification
 */
export async function scheduleStreakReminder(
  currentStreak: number,
  options?: NotificationOptions
): Promise<string | null> {
  try {
    const notificationId = `streak-reminder-${Date.now()}`;
    const triggerTime = new Date();
    triggerTime.setDate(triggerTime.getDate() + 1);
    triggerTime.setHours(9, 0, 0, 0); // Schedule for 9 AM tomorrow

    const message = currentStreak > 0
      ? `Don't break your ${currentStreak}-day streak! Complete a task today to keep it going. 💪`
      : "Start your productivity streak today! Complete a task to begin. 🚀";

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: "Streak Reminder",
        body: message,
        data: {
          type: 'streak-reminder',
          streak: currentStreak,
        },
        sound: getSound(options?.sound ?? 'default'),
        vibrate: getVibrationPattern(options?.vibration ?? 'default'),
        priority: getPriority(options?.priority ?? 'default'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
      },
    });

    console.log(`Scheduled streak reminder ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling streak reminder:', error);
    return null;
  }
}

/**
 * Schedule a weekly progress summary notification
 */
export async function scheduleWeeklyProgressSummary(
  tasksCompleted: number,
  totalTasks: number,
  options?: NotificationOptions
): Promise<string | null> {
  try {
    const notificationId = `weekly-summary-${Date.now()}`;
    const triggerTime = new Date();
    triggerTime.setDate(triggerTime.getDate() + 7);
    triggerTime.setHours(18, 0, 0, 0); // Schedule for 6 PM next week

    const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const message = `This week: ${tasksCompleted}/${totalTasks} tasks completed (${completionRate}%). Keep up the great work! 📊`;

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: "Weekly Progress Summary",
        body: message,
        data: {
          type: 'weekly-summary',
          tasksCompleted,
          totalTasks,
          completionRate,
        },
        sound: getSound(options?.sound ?? 'default'),
        vibrate: getVibrationPattern(options?.vibration ?? 'default'),
        priority: getPriority(options?.priority ?? 'default'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
      },
    });

    console.log(`Scheduled weekly summary ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling weekly summary:', error);
    return null;
  }
}

/**
 * Reschedule all notifications for existing tasks
 * This should be called on app launch to ensure notifications are restored
 */
export async function rescheduleAllNotifications(tasks: Task[]): Promise<void> {
  console.log(`Rescheduling notifications for ${tasks.length} tasks`);
  
  let scheduledCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const task of tasks) {
    // Skip tasks without reminders or due dates
    if (!task.reminder || !task.dueDate) {
      continue;
    }
    
    // Skip completed tasks
    if (task.status === 'done') {
      continue;
    }
    
    try {
      if (task.recurringReminder?.enabled) {
        const recurringOptions = {
          ...task.recurringReminder,
          endDate: task.recurringReminder.endDate
            ? new Date(task.recurringReminder.endDate)
            : undefined,
        };
        const result = await scheduleRecurringNotification(task, recurringOptions, {
          sound: task.reminderSound,
          vibration: task.reminderVibration,
          priority: task.reminderPriority,
        });
        if (result) {
          scheduledCount++;
        } else {
          skippedCount++;
        }
      } else {
        const result = await scheduleTaskNotification(task, {
          sound: task.reminderSound,
          vibration: task.reminderVibration,
          priority: task.reminderPriority,
        });
        if (result) {
          scheduledCount++;
        } else {
          skippedCount++;
        }
      }
    } catch (error) {
      console.error(`Error rescheduling notification for task ${task.id}:`, {
        error,
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        reminder: task.reminder,
      });
      errorCount++;
    }
  }
  
  console.log(`Rescheduled ${scheduledCount} notifications, skipped ${skippedCount}, errors ${errorCount}`);
}
