/**
 * TasksContext — Task list per user, persisted to AsyncStorage.
 * Storage key: @neurosync_tasks_${userId}
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
import { auth,db} from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "@neurosync_tasks_";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = "done" | "in-progress" | "todo";

export interface SubTask {
  id:          string;
  text:        string;
  isAdding:    boolean;  // selected/checked in the add-task form
  isGenarated: boolean;  // true = created by AI breakdown
  isDone:      boolean;  // true = marked complete in the task list
}

export interface Task {
  id:       string;
  category: string;   // Work | Personal | Shopping | Health | Finance | Creative | Other
  title:    string;
  time?:    string;
  status:   TaskStatus;
  icon:     string;   // emoji from aiController CATEGORY_META
  iconBg:   string;   // hex colour from aiController CATEGORY_META
  dateKey:  string;   // YYYY-MM-DD — used to filter tasks by day
  subtasks?: SubTask[];

  isSynced?: boolean;
}

type TasksContextType = {
  tasks:            Task[];
  addTask:          (task: Omit<Task, "id">) => void;
  updateTask:       (id: string, updates: Partial<Task>) => void;
  removeTask:       (id: string) => void;
  toggleSubtaskDone:(taskId: string, subtaskId: string) => void;
  isLoading:        boolean;
  userId:           string | null;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const TasksContext = createContext<TasksContextType | null>(null);

// ─── Storage helpers ──────────────────────────────────────────────────────────

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

async function saveTasksForUser(userId: string, tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(tasks));
  } catch (e) {
    console.warn("[TasksContext] Failed to persist tasks:", e);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [userId,    setUserId]    = useState<string | null>(null);
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Auth: track current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // ── Load tasks when user changes (or clear on logout)
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

  // ── Persist tasks whenever they change (skip during initial load)
  useEffect(() => {
    if (userId && !isLoading) {
      saveTasksForUser(userId, tasks);
    }
  }, [userId, tasks, isLoading]);

  const syncTasksToFirebase = useCallback(async () => {
    console.log("Starting task sync..."); // 👈 debug
    if (!userId) return;

    const updatedTasks = [...tasks];

    for (let i = 0; i < updatedTasks.length; i++) {
      const task = updatedTasks[i];

      if (task.isSynced) continue;

      try {
        const { id, ...taskData } = task;

        await setDoc(
          doc(db, "users", userId, "tasks", id),
          taskData
        );

        updatedTasks[i] = { ...task, isSynced: true };

      } catch (e) {
        console.log("Sync failed:", e);
      }
    }

    setTasks(updatedTasks);
  }, [userId]);

  // useEffect(() => {
  //   console.log("Setting up network listener for task sync...");   // 👈 debug
  //   const unsubscribe = NetInfo.addEventListener((state) => {
  //     if (state.isConnected) {
  //       console.log("Device is online, attempting to sync tasks...");  // 👈 debug
  //       syncTasksToFirebase(); // 👈 trigger sync
  //       console.log("Sync complete."); // 👈 debug
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [syncTasksToFirebase]);
  const syncRef = useRef(syncTasksToFirebase);

    useEffect(() => {
      syncRef.current = syncTasksToFirebase;
    }, [syncTasksToFirebase]);

    useEffect(() => {
      const unsubscribe = NetInfo.addEventListener((state) => {
        if (state.isConnected) {
          syncRef.current();
          console.log("Device is online, attempted to sync tasks.");  // 👈 debug
        }
      });

      return () => unsubscribe();
    }, []);
//   useEffect(() => {
//   if (userId) {
//     syncTasksToFirebase();
//   }
// }, [userId, syncTasksToFirebase]);

  // ── addTask
  const addTask = useCallback((task: Omit<Task, "id">) => {
    const id = String(Date.now());

    const newTask: Task = {
      ...task,
      id,
      isSynced: false, 
    };

    setTasks((prev) => [newTask, ...prev]);
  }, []);

  // ── updateTask
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...updates, isSynced: false } // 👈 important
          : t
      )
    );
  }, []);

  // ── removeTask
  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    // OPTIONAL: also delete from Firebase later
  }, []);

  // ── toggleSubtaskDone — flips isDone on a specific subtask
  const toggleSubtaskDone = useCallback(
    (taskId: string, subtaskId: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId || !task.subtasks) return task;

          return {
            ...task,
            isSynced: false,
            subtasks: task.subtasks.map((sub) =>
              sub.id === subtaskId
                ? { ...sub, isDone: !sub.isDone }
                : sub
            ),
          };
        })
      );
    },
    []
  );

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        removeTask,
        toggleSubtaskDone,
        isLoading,
        userId,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTasks(): TasksContextType {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks must be used inside <TasksProvider>");
  }
  return ctx;
}