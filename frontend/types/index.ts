/**
 * Shared TypeScript type definitions for NeuroSync
 */

export type TaskStatus = 'done' | 'in-progress' | 'todo';

export interface SubTask {
  id: string;
  text: string;
  isAdding: boolean;
  isGenarated: boolean;
  isDone: boolean;
  dependsOn?: string[];
  notes?: string;
  order?: number;
  durationMinutes?: number;
}

// Alias for backwards compatibility
export type Subtask = SubTask;

export interface Task {
  id: string;
  category: string;
  title: string;
  time?: string;
  status: TaskStatus;
  dueDate?: string | null;
  location?: string;
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
  icon: string;
  iconBg: string;
  dateKey: string;
  subtasks?: SubTask[];
  isSynced: boolean;
  sessionTime?: number;
  templateId?: string;
  linkedSessionIds?: string[];
  durationMinutes?: number;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  pendingSync?: boolean;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string; // ISO timestamp
  durationMinutes: number;
  mode: 'focus' | 'break';
  subtaskCompletedId?: string;
  isSynced?: boolean;
}

export interface MoodEntry {
  id: string;
  mood: number | string;
  energyLevel?: number;
  note?: string;
  notes?: string;
  tags?: string[];
  timestamp: string;
  date?: string;
  isSynced?: boolean;
}

export interface TaskTemplate {
  id: string;
  title: string;
  category: string;
  icon: string;
  iconBg: string;
  subtasks: SubTask[];
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  age: string;
  about: string;
  profileImage: string;
  themeName?: string;
  hapticFeedback?: boolean;
}
