/**
 * Shared TypeScript type definitions for the frontend
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  completed?: boolean;
  createdAt: string;
  updatedAt: string;
  pendingSync?: boolean;
  icon?: string;
  iconBg?: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  text: string;
  isAdding: boolean;
  isGenarated: boolean;
  isDone: boolean;
  durationMinutes?: number;
  notes?: string;
  order?: number;
  dependsOn?: string[];
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string;
  durationMinutes: number;
  mode: 'focus' | 'break';
  subtaskCompletedId?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  notes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  age: string;
  about: string;
  profileImage: string;
}
