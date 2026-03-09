/**
 * TasksContext — Task list per user, persisted to AsyncStorage.
 * Storage key: @neurosync_tasks_${userId}
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

const STORAGE_KEY_PREFIX = "@neurosync_tasks_";

export type TaskStatus = "done" | "in-progress" | "todo";

export interface Task {
  id: string;
  category: string;
  title: string;
  time: string;
  status: TaskStatus;
  icon: string;
  iconBg: string;
  dateKey: string; // YYYY-MM-DD for filtering by day
}

type TasksContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  isLoading: boolean;
  userId: string | null;
};

const TasksContext = createContext<TasksContextType | null>(null);

async function loadTasksForUser(userId: string): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveTasksForUser(userId: string, tasks: Task[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Failed to persist tasks", e);
  }
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to auth: when user changes, load that user's tasks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // When userId changes, load tasks for that user (or clear if logged out)
  useEffect(() => {
    if (userId === null) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadTasksForUser(userId).then((loaded) => {
      setTasks(loaded);
      setIsLoading(false);
    });
  }, [userId]);

  // Persist tasks when they change (only when a user is signed in)
  useEffect(() => {
    if (userId && !isLoading) {
      saveTasksForUser(userId, tasks);
    }
  }, [userId, tasks, isLoading]);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    const id = String(Date.now());
    setTasks((prev) => [...prev, { ...task, id }]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <TasksContext.Provider
      value={{ tasks, addTask, updateTask, removeTask, isLoading, userId }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextType {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks must be used inside <TasksProvider>");
  }
  return ctx;
}
