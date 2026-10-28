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
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import {
  scheduleTaskNotification,
  scheduleRecurringNotification,
  cancelTaskNotification,
  rescheduleAllNotifications,
} from "../services/notifications";
import { logActualDuration } from "../services/calibration";
import {
  fromFirestoreTask,
  loadTaskTombstones,
  loadTasksForUser,
  mergeTasks,
  saveTaskTombstones,
  saveTasksForUser,
  toFirestoreTask,
  type TaskTombstones,
} from "../services/taskStorage";
import type { SubTask, Task, TaskStatus } from "../types";

export type { SubTask, Task, TaskStatus };

type TasksContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => Task;
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

function getStatusFromSubtasks(subtasks?: SubTask[]): TaskStatus | null {
  if (!subtasks || subtasks.length === 0) return null;

  const doneCount = subtasks.filter((subtask) => subtask.isDone).length;
  if (doneCount === 0) return "todo";
  if (doneCount === subtasks.length) return "done";
  return "in-progress";
}

function nextUpdatedAt(previous?: string): string {
  const previousMs = previous ? Date.parse(previous) : Number.NaN;
  const nextMs = Math.max(
    Date.now(),
    Number.isFinite(previousMs) ? previousMs + 1 : 0
  );
  return new Date(nextMs).toISOString();
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<{
    tasks: Task[];
    tombstones: TaskTombstones;
  }>({ tasks: [], tombstones: {} });
  const { tasks, tombstones } = taskState;
  const [isLoading, setIsLoading] = useState(true);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTasks = useCallback(
    (action: React.SetStateAction<Task[]>) => {
      setTaskState((prev) => ({
        ...prev,
        tasks:
          typeof action === "function" ? action(prev.tasks) : action,
      }));
    },
    []
  );

  const setTombstones = useCallback(
    (action: React.SetStateAction<TaskTombstones>) => {
      setTaskState((prev) => ({
        ...prev,
        tombstones:
          typeof action === "function" ? action(prev.tombstones) : action,
      }));
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });

    return () => unsub();
  }, []);

  const syncTasksToFirebase = useCallback(async () => {
    if (!userId) return;

    const pendingTasks = tasks.filter((task) => !task.isSynced);
    if (pendingTasks.length === 0) return;

    for (const task of pendingTasks) {
      try {
        await setDoc(
          doc(db, "users", userId, "tasks", task.id),
          toFirestoreTask(task)
        );
        setTasks((prev) =>
          prev.map((currentTask) =>
            currentTask.id === task.id &&
            currentTask.updatedAt === task.updatedAt
              ? { ...currentTask, isSynced: true }
              : currentTask
          )
        );
      } catch (e) {
        console.log("Sync failed:", e);
      }
    }
  }, [setTasks, tasks, userId]);

  const syncDeletedTasksToFirebase = useCallback(async () => {
    if (!userId) return;
    const pendingDeletes = Object.entries(tombstones).filter(
      ([, tombstone]) => !tombstone.synced
    );

    for (const [taskId, tombstone] of pendingDeletes) {
      try {
        await deleteDoc(doc(db, "users", userId, "tasks", taskId));
        setTombstones((prev) => {
          const current = prev[taskId];
          if (!current || current.deletedAt !== tombstone.deletedAt) return prev;
          return {
            ...prev,
            [taskId]: { ...current, synced: true },
          };
        });
      } catch (e) {
        console.log("Delete sync failed:", e);
      }
    }
  }, [setTombstones, tombstones, userId]);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setTaskState({ tasks: [], tombstones: {} });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Promise.all([
      loadTasksForUser(userId),
      loadTaskTombstones(userId),
    ])
      .then(([loadedTasks, loadedTombstones]) => {
        if (cancelled) return;
        setTaskState({
          tasks: loadedTasks,
          tombstones: loadedTombstones,
        });
        setIsLoading(false);

        rescheduleAllNotifications(loadedTasks).catch((error) => {
          console.error(
            "Failed to reschedule notifications on app launch:",
            error
          );
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("Failed to load local tasks:", error);
        setTaskState({ tasks: [], tombstones: {} });
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (userId && !isLoading) {
      void Promise.all([
        saveTasksForUser(userId, tasks),
        saveTaskTombstones(userId, tombstones),
      ]);
    }
  }, [isLoading, tasks, tombstones, userId]);

  useEffect(() => {
    if (!userId || isLoading) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", userId, "tasks"),
      (snapshot) => {
        const remoteTasks = snapshot.docs.map((docSnap) =>
          fromFirestoreTask(docSnap.id, docSnap.data())
        );
        setTaskState((prev) =>
          mergeTasks(
            prev.tasks,
            remoteTasks,
            prev.tombstones,
            !snapshot.metadata.fromCache
          )
        );
      },
      (error) => {
        console.warn("Task subscription failed:", error);
      }
    );

    return () => unsubscribe();
  }, [isLoading, userId]);

  useEffect(() => {
    if (!userId || isLoading) return;
    let cancelled = false;

    const syncIfOnline = async () => {
      try {
        const state = await NetInfo.fetch();
        if (cancelled || !state.isConnected) return;
        await syncTasksToFirebase();
        await syncDeletedTasksToFirebase();
      } catch (error) {
        console.log("Online task sync failed:", error);
      }
    };

    void syncIfOnline();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) void syncIfOnline();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [
    isLoading,
    syncDeletedTasksToFirebase,
    syncTasksToFirebase,
    userId,
  ]);

  // ── Existing methods ──────────────────────────────────────────────────────

  // Counter to ensure unique IDs even when created in same millisecond
  const idCounterRef = useRef(0);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    idCounterRef.current += 1;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: `${Date.now()}_${idCounterRef.current}_${Math.random().toString(36).slice(2, 7)}`,
      isSynced: false,
      createdAt: task.createdAt ?? now,
      updatedAt: now,
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

        const updatedTask = {
          ...task,
          ...updates,
          isSynced: false,
          updatedAt: nextUpdatedAt(task.updatedAt),
        };

        // Handle notification updates
        const reminderChanged = updates.reminder !== undefined;
        const dueDateChanged = updates.dueDate !== undefined;
        const recurringChanged = updates.recurringReminder !== undefined;

        if (reminderChanged || dueDateChanged || recurringChanged) {
          // Cancel existing notification
          cancelTaskNotification(id).catch((error) => {
            console.error('Failed to cancel notification:', error);
          });

          // Schedule new notification if reminder is set and task is not done
          if (updatedTask.reminder && updatedTask.dueDate && updatedTask.status !== 'done') {
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
    const taskToDelete = tasks.find((task) => task.id === id);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((task) => task.id !== id));
    setTombstones((prev) => ({
      ...prev,
      [id]: {
        deletedAt: new Date().toISOString(),
        synced: false,
      },
    }));
    setLastDeleted(taskToDelete);

    cancelTaskNotification(id).catch((error) => {
      console.error("Failed to cancel notification:", error);
    });

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = setTimeout(() => {
      setLastDeleted(null);
      undoTimerRef.current = null;
    }, 5000);
  }, [setTombstones, tasks]);

  const undoDelete = useCallback((task: Task) => {
    // Cancel the pending Firestore delete
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    setTombstones((prev) => {
      if (!(task.id in prev)) return prev;
      const next = { ...prev };
      delete next[task.id];
      return next;
    });

    // Restore the task to the top of state, mark unsynced so it re-syncs
    setTasks((prev) => {
      // Guard against duplicates if undo fires twice
      if (prev.find((t) => t.id === task.id)) return prev;
      return [
        {
          ...task,
          isSynced: false,
          updatedAt: nextUpdatedAt(task.updatedAt),
        },
        ...prev,
      ];
    });

    // Reschedule notification for the restored task
    // This ensures notifications are restored when a task is undeleted
    if (task.reminder && task.dueDate && task.status !== 'done') {
      if (task.recurringReminder?.enabled) {
        const recurringOptions = {
          ...task.recurringReminder,
          endDate: task.recurringReminder.endDate
            ? new Date(task.recurringReminder.endDate)
            : undefined,
        };
        scheduleRecurringNotification(task, recurringOptions, {
          sound: task.reminderSound,
          vibration: task.reminderVibration,
          priority: task.reminderPriority,
        }).catch((error) => {
          console.error('Failed to schedule recurring notification after undo:', error);
        });
      } else {
        scheduleTaskNotification(task, {
          sound: task.reminderSound,
          vibration: task.reminderVibration,
          priority: task.reminderPriority,
        }).catch((error) => {
          console.error('Failed to schedule notification after undo:', error);
        });
      }
    }

    setLastDeleted(null);
  }, [setTombstones]);

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
          updatedAt: nextUpdatedAt(task.updatedAt),
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

          if (userId && task.durationMinutes && task.durationMinutes > 0 && task.sessionTime && task.sessionTime > 0) {
            logActualDuration(userId, task.id, task.category || "Other", task.durationMinutes, task.sessionTime).catch((err) => {
              console.warn("Failed to log task calibration on complete:", err);
            });
          }
        }
        
        // Reschedule notification when task is moved back to todo/in-progress
        // This ensures notifications are restored if a task is unmarked as done
        if (newStatus !== "done" && task.reminder && task.dueDate) {
          if (task.recurringReminder?.enabled) {
            const recurringOptions = {
              ...task.recurringReminder,
              endDate: task.recurringReminder.endDate
                ? new Date(task.recurringReminder.endDate)
                : undefined,
            };
            scheduleRecurringNotification(task, recurringOptions, {
              sound: task.reminderSound,
              vibration: task.reminderVibration,
              priority: task.reminderPriority,
            }).catch((error) => {
              console.error('Failed to schedule recurring notification:', error);
            });
          } else {
            scheduleTaskNotification(task, {
              sound: task.reminderSound,
              vibration: task.reminderVibration,
              priority: task.reminderPriority,
            }).catch((error) => {
              console.error('Failed to schedule notification:', error);
            });
          }
        }

        return {
          ...task,
          status: newStatus,
          subtasks: task.subtasks?.map((subtask) => ({
            ...subtask,
            isDone: newStatus === "done" ? true : subtask.isDone,
          })),
          isSynced: false,
          updatedAt: nextUpdatedAt(task.updatedAt),
        };
      })
    );
  }, [userId]);

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
            updatedAt: nextUpdatedAt(task.updatedAt),
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
            updatedAt: nextUpdatedAt(task.updatedAt),
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
            updatedAt: nextUpdatedAt(task.updatedAt),
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
