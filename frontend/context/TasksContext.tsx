/**
 * TasksContext - offline-first task storage with Firebase sync
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import {
  scheduleTaskNotification,
  scheduleRecurringNotification,
  cancelTaskNotification,
} from "../services/notifications";

const STORAGE_KEY_PREFIX = "@neurosync_tasks_";

export type TaskStatus = "done" | "in-progress" | "todo";

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

export interface Task {
  id: string;
  category: string;
  title: string;
  time?: string;
  status: TaskStatus;
  dueDate?: string;
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
}

type TasksContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleSubtaskDone: (taskId: string, subtaskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  reorderSubtasks: (taskId: string, newOrder: SubTask[]) => void;
  addSubtaskNote: (taskId: string, subtaskId: string, note: string) => void;
  logFocusSession: (taskId: string, minutes: number, sessionId: string) => void;
  undoDelete: (task: Task) => void;
  isLoading: boolean;
  userId: string | null;
  lastDeleted: Task | null;
};

const TasksContext = createContext<TasksContextType | null>(null);

function omitUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as T;
}

function getStatusFromSubtasks(subtasks?: SubTask[]): TaskStatus | null {
  if (!subtasks || subtasks.length === 0) return null;

  const doneCount = subtasks.filter((subtask) => subtask.isDone).length;
  if (doneCount === 0) return "todo";
  if (doneCount === subtasks.length) return "done";
  return "in-progress";
}

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
    console.warn("Persist failed:", e);
  }
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
  const deletedTaskIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedFirebaseRef = useRef<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });

    return () => unsub();
  }, []);

  const mergeTasksFromFirebase = useCallback(async () => {
    if (!userId) return;

    try {
      const snapshot = await getDocs(collection(db, "users", userId, "tasks"));

      setTasks((prev) => {
        const localMap = new Map(prev.map((task) => [task.id, task]));
        const newTasks: Task[] = [];
        const updatedTasks = new Map<string, Task>();

        snapshot.forEach((docSnap) => {
          const firebaseTask = {
            id: docSnap.id,
            ...docSnap.data(),
            isSynced: true,
          } as Task;

          const localTask = localMap.get(firebaseTask.id);
          if (!localTask) {
            newTasks.push(firebaseTask);
            return;
          }

          if (!localTask.isSynced) {
            updatedTasks.set(firebaseTask.id, firebaseTask);
          }
        });

        if (newTasks.length === 0 && updatedTasks.size === 0) {
          return prev;
        }

        const merged = [
          ...prev.map((task) => updatedTasks.get(task.id) ?? task),
          ...newTasks,
        ];

        saveTasksForUser(userId, merged);
        return merged;
      });
    } catch (e) {
      console.log("Merge failed:", e);
    }
  }, [userId]);

  const syncTasksToFirebase = useCallback(async () => {
    if (!userId) return;

    const pendingTasks = tasks.filter((task) => !task.isSynced);
    if (pendingTasks.length === 0) return;

    const syncedTaskIds = new Set<string>();

    for (const task of pendingTasks) {
      try {
        const { id, ...data } = task;
        await setDoc(
          doc(db, "users", userId, "tasks", id),
          omitUndefinedFields(data)
        );
        syncedTaskIds.add(id);
      } catch (e) {
        console.log("Sync failed:", e);
      }
    }

    if (syncedTaskIds.size === 0) return;

    setTasks((prev) =>
      prev.map((task) =>
        syncedTaskIds.has(task.id) ? { ...task, isSynced: true } : task
      )
    );
  }, [tasks, userId]);

  const syncDeletedTasksToFirebase = useCallback(async () => {
    if (!userId || deletedTaskIdsRef.current.size === 0) return;

    const deletedTaskIds = Array.from(deletedTaskIdsRef.current);

    for (const taskId of deletedTaskIds) {
      try {
        await deleteDoc(doc(db, "users", userId, "tasks", taskId));
        deletedTaskIdsRef.current.delete(taskId);
      } catch (e) {
        console.log("Delete sync failed:", e);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      hasHydratedFirebaseRef.current = null;
      return;
    }

    setIsLoading(true);

    loadTasksForUser(userId).then((loaded) => {
      setTasks(loaded);
      setIsLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (userId && !isLoading) {
      saveTasksForUser(userId, tasks);
    }
  }, [isLoading, tasks, userId]);

  useEffect(() => {
    if (!userId || isLoading) return;
    const needsInitialMerge = hasHydratedFirebaseRef.current !== userId;
    if (
      !needsInitialMerge &&
      tasks.every((task) => task.isSynced) &&
      deletedTaskIdsRef.current.size === 0
    ) {
      return;
    }

    let cancelled = false;

    const syncIfOnline = async () => {
      try {
        const state = await NetInfo.fetch();
        if (cancelled || !state.isConnected) return;

        await syncTasksToFirebase();
        await syncDeletedTasksToFirebase();
        await mergeTasksFromFirebase();
        hasHydratedFirebaseRef.current = userId;
      } catch (e) {
        console.log("Online sync check failed:", e);
      }
    };

    syncIfOnline();

    return () => {
      cancelled = true;
    };
  }, [
    isLoading,
    mergeTasksFromFirebase,
    syncDeletedTasksToFirebase,
    syncTasksToFirebase,
    tasks,
    userId,
  ]);

  const syncRef = useRef(syncTasksToFirebase);

  useEffect(() => {
    syncRef.current = syncTasksToFirebase;
  }, [syncTasksToFirebase]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncRef.current();
        syncDeletedTasksToFirebase();
        mergeTasksFromFirebase();
      }
    });

    return () => unsub();
  }, [mergeTasksFromFirebase, syncDeletedTasksToFirebase]);

  // ── Existing methods ──────────────────────────────────────────────────────

  // Counter to ensure unique IDs even when created in same millisecond
  const idCounterRef = useRef(0);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    idCounterRef.current += 1;
    const newTask: Task = {
      ...task,
      id: `${Date.now()}_${idCounterRef.current}_${Math.random().toString(36).slice(2, 7)}`,
      isSynced: false,
    };

    setTasks((prev) => [newTask, ...prev]);

    // Schedule notification if reminder is set
    if (newTask.reminder && newTask.dueDate) {
      if (newTask.recurringReminder?.enabled) {
        const recurringOptions = {
          ...newTask.recurringReminder,
          endDate: newTask.recurringReminder.endDate
            ? new Date(newTask.recurringReminder.endDate)
            : undefined,
        };
        scheduleRecurringNotification(newTask, recurringOptions, {
          sound: newTask.reminderSound,
          vibration: newTask.reminderVibration,
          priority: newTask.reminderPriority,
        }).catch((error) => {
          console.error('Failed to schedule recurring notification:', error);
        });
      } else {
        scheduleTaskNotification(newTask, {
          sound: newTask.reminderSound,
          vibration: newTask.reminderVibration,
          priority: newTask.reminderPriority,
        }).catch((error) => {
          console.error('Failed to schedule notification:', error);
        });
      }
    }

    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        const updatedTask = { ...task, ...updates, isSynced: false };

        // Handle notification updates
        const reminderChanged = updates.reminder !== undefined;
        const dueDateChanged = updates.dueDate !== undefined;
        const recurringChanged = updates.recurringReminder !== undefined;

        if (reminderChanged || dueDateChanged || recurringChanged) {
          // Cancel existing notification
          cancelTaskNotification(id).catch((error) => {
            console.error('Failed to cancel notification:', error);
          });

          // Schedule new notification if reminder is set
          if (updatedTask.reminder && updatedTask.dueDate) {
            if (updatedTask.recurringReminder?.enabled) {
              const recurringOptions = {
                ...updatedTask.recurringReminder,
                endDate: updatedTask.recurringReminder.endDate
                  ? new Date(updatedTask.recurringReminder.endDate)
                  : undefined,
              };
              scheduleRecurringNotification(updatedTask, recurringOptions, {
                sound: updatedTask.reminderSound,
                vibration: updatedTask.reminderVibration,
                priority: updatedTask.reminderPriority,
              }).catch((error) => {
                console.error('Failed to schedule recurring notification:', error);
              });
            } else {
              scheduleTaskNotification(updatedTask, {
                sound: updatedTask.reminderSound,
                vibration: updatedTask.reminderVibration,
                priority: updatedTask.reminderPriority,
              }).catch((error) => {
                console.error('Failed to schedule notification:', error);
              });
            }
          }
        }

        return updatedTask;
      })
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    // Save the task for potential undo before removing
    setTasks((prev) => {
      const taskToDelete = prev.find((t) => t.id === id);
      if (taskToDelete) {
        setLastDeleted(taskToDelete);

        // Cancel notification for the deleted task
        cancelTaskNotification(id).catch((error) => {
          console.error('Failed to cancel notification:', error);
        });

        // Clear any existing undo timer
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
        }

        // After 5 seconds, commit the delete to Firestore and clear lastDeleted
        undoTimerRef.current = setTimeout(() => {
          deletedTaskIdsRef.current.add(id);
          setLastDeleted(null);
        }, 5000);
      }

      return prev.filter((task) => task.id !== id);
    });
  }, []);

  const undoDelete = useCallback((task: Task) => {
    // Cancel the pending Firestore delete
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    // Remove from the deleted set in case it was already added
    deletedTaskIdsRef.current.delete(task.id);

    // Restore the task to the top of state, mark unsynced so it re-syncs
    setTasks((prev) => {
      // Guard against duplicates if undo fires twice
      if (prev.find((t) => t.id === task.id)) return prev;
      return [{ ...task, isSynced: false }, ...prev];
    });

    setLastDeleted(null);
  }, []);

  const toggleSubtaskDone = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId || !task.subtasks) return task;

        const updatedSubtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, isDone: !subtask.isDone }
            : subtask
        );

        const derivedStatus = getStatusFromSubtasks(updatedSubtasks);

        return {
          ...task,
          isSynced: false,
          status: derivedStatus ?? task.status,
          subtasks: updatedSubtasks,
        };
      })
    );
  }, []);

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

        // Cancel notification when task is marked as done
        if (newStatus === "done") {
          cancelTaskNotification(taskId).catch((error) => {
            console.error('Failed to cancel notification:', error);
          });
        }

        return {
          ...task,
          status: newStatus,
          subtasks: task.subtasks?.map((subtask) => ({
            ...subtask,
            isDone: newStatus === "done" ? true : subtask.isDone,
          })),
          isSynced: false,
        };
      })
    );
  }, []);

  // ── New methods ───────────────────────────────────────────────────────────

  const reorderSubtasks = useCallback(
    (taskId: string, newOrder: SubTask[]) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;

          // Stamp each subtask with its new order index
          const reordered = newOrder.map((st, index) => ({
            ...st,
            order: index,
          }));

          return {
            ...task,
            subtasks: reordered,
            isSynced: false,
          };
        })
      );
    },
    []
  );

  const addSubtaskNote = useCallback(
    (taskId: string, subtaskId: string, note: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId || !task.subtasks) return task;

          return {
            ...task,
            isSynced: false,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, notes: note.trim() || undefined }
                : subtask
            ),
          };
        })
      );
    },
    []
  );

  const logFocusSession = useCallback(
    (taskId: string, minutes: number, sessionId: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;

          const currentTime = task.sessionTime ?? 0;
          const currentSessions = task.linkedSessionIds ?? [];

          // Guard against duplicate session ids
          if (currentSessions.includes(sessionId)) return task;

          return {
            ...task,
            sessionTime: currentTime + minutes,
            linkedSessionIds: [...currentSessions, sessionId],
            isSynced: false,
          };
        })
      );
    },
    []
  );

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
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
        reorderSubtasks,
        addSubtaskNote,
        logFocusSession,
        undoDelete,
        isLoading,
        userId,
        lastDeleted,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextType {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside provider");
  return ctx;
}