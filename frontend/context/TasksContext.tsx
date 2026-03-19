/**
 * TasksContext — Offline-first with bidirectional sync
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";

// ─── Constants ─────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "@neurosync_tasks_";

// ─── Types ─────────────────────────────────────────────────

export type TaskStatus = "done" |"in-progress" |"todo";

export interface SubTask {
  id: string;
  text: string;
  isAdding: boolean;
  isGenarated: boolean;
  isDone: boolean;
}

export interface Task {
  id: string;
  category: string;
  title: string;
  time?: string;
  status: TaskStatus;
  dueDate?: string;
  location?: string;
  reminder?: string;
  icon: string;
  iconBg: string;
  dateKey: string;
  subtasks?: SubTask[];
  isSynced: boolean;
}

type TasksContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleSubtaskDone: (taskId: string, subtaskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  isLoading: boolean;
  userId: string | null;
};

const TasksContext = createContext<TasksContextType | null>(null);

// ─── Storage Helpers ──────────────────────────────────────

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
    await AsyncStorage.setItem(
      STORAGE_KEY_PREFIX + userId,
      JSON.stringify(tasks)
    );
  } catch (e) {
    console.warn("Persist failed:", e);
  }
}

// ─── Provider ─────────────────────────────────────────────

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // ── Load local tasks
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    loadTasksForUser(userId).then((loaded) => {
      setTasks(loaded);
      setIsLoading(false);

      // 🔥 Merge missing Firebase tasks after load
      mergeTasksFromFirebase();
    });
  }, [userId]);

  // ── Persist local
  useEffect(() => {
    if (userId && !isLoading) {
      saveTasksForUser(userId, tasks);
    }
  }, [tasks, userId, isLoading]);

  // ─────────────────────────────────────────────────────────
  // 🔥 Sync Local → Firebase
  // ─────────────────────────────────────────────────────────

  const syncTasksToFirebase = useCallback(async () => {
    if (!userId) return;

    const updated = [...tasks];

    for (let i = 0; i < updated.length; i++) {
      const task = updated[i];
      if (task.isSynced) continue;

      try {
        const { id, ...data } = task;

        await setDoc(doc(db, "users", userId, "tasks", id), data);

        updated[i] = { ...task, isSynced: true };
      } catch (e) {
        console.log("Sync failed:", e);
      }
    }

    setTasks(updated);
  }, [userId,tasks]);

  // ─────────────────────────────────────────────────────────
  // 🔥 Merge Firebase → Local (ONLY missing)
  // ─────────────────────────────────────────────────────────

  const mergeTasksFromFirebase = useCallback(async () => {
    if (!userId) return;

    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "tasks")
      );

      setTasks((prev) => {
        const localMap = new Map(prev.map((t) => [t.id, t]));
        const newTasks: Task[] = [];

        snapshot.forEach((docSnap) => {
          const task = {
            id: docSnap.id,
            ...docSnap.data(),
            isSynced: true,
          } as Task;

          if (!localMap.has(task.id)) {
            newTasks.push(task);
          }
        });

        if (newTasks.length === 0) return prev;

        const merged = [...prev, ...newTasks];

        console.log("Merged:", newTasks.length);

        saveTasksForUser(userId, merged);

        return merged;
      });
    } catch (e) {
      console.log("Merge failed:", e);
    }
  }, [userId]);

  // ─────────────────────────────────────────────────────────
  // 🌐 Network listener (NO stale closure bug)
  // ─────────────────────────────────────────────────────────

  const syncRef = useRef(syncTasksToFirebase);

  useEffect(() => {
    syncRef.current = syncTasksToFirebase;
  }, [syncTasksToFirebase]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncRef.current();         // local → firebase
        mergeTasksFromFirebase();  // firebase → local
      }
    });

    return () => unsub();
  }, [mergeTasksFromFirebase]);

  // ─────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────

  const addTask = useCallback((task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: String(Date.now()),
      isSynced: false,
    };

    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, isSynced: false } : t
      )
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleSubtaskDone = useCallback(
    (taskId: string, subtaskId: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId || !task.subtasks) return task;

          return {
            ...task,
            isSynced: false,
            subtasks: task.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
            ),
          };
        })
      );
    },
    []
  );

  const toggleTaskStatus = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        let newStatus: TaskStatus;

        switch (task.status) {
          case "todo":
            newStatus = "in-progress";
            break;
          case "in-progress":
            newStatus = "done";
            break;
          case "done":
          default:
            newStatus = "todo";
            break;
        }

        return {
          ...task,
          status: newStatus,
          isSynced: false,
        };
      })
    );
  }, []);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        removeTask,
        toggleSubtaskDone,
        toggleTaskStatus,
        isLoading,
        userId,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────

export function useTasks(): TasksContextType {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside provider");
  return ctx;
}