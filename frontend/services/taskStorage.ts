import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Task } from "../types";

const TASKS_STORAGE_KEY_PREFIX = "@neurosync_tasks_";
const TOMBSTONES_STORAGE_KEY_PREFIX = "@neurosync_task_tombstones_";
const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface TaskTombstone {
  deletedAt: string;
  synced: boolean;
}

export type TaskTombstones = Record<string, TaskTombstone>;

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function timestampMs(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeTask(task: Task): Task {
  return {
    ...task,
    updatedAt:
      task.updatedAt ?? task.createdAt ?? new Date(0).toISOString(),
    isSynced: task.isSynced ?? false,
  };
}

export async function loadTasksForUser(userId: string): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(TASKS_STORAGE_KEY_PREFIX + userId);
    return parseJsonArray(raw)
      .filter((task): task is Task => Boolean(task) && typeof task === "object")
      .map(normalizeTask);
  } catch {
    return [];
  }
}

export async function saveTasksForUser(
  userId: string,
  tasks: Task[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      TASKS_STORAGE_KEY_PREFIX + userId,
      JSON.stringify(tasks)
    );
  } catch (error) {
    console.warn("Persist failed:", error);
  }
}

export async function loadTaskTombstones(
  userId: string
): Promise<TaskTombstones> {
  try {
    const raw = await AsyncStorage.getItem(
      TOMBSTONES_STORAGE_KEY_PREFIX + userId
    );
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const cutoff = Date.now() - TOMBSTONE_TTL_MS;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, tombstone]) => {
        if (!tombstone || typeof tombstone !== "object") return false;
        const deletedAt = (tombstone as TaskTombstone).deletedAt;
        return timestampMs(deletedAt) >= cutoff;
      })
    ) as TaskTombstones;
  } catch {
    return {};
  }
}

export async function saveTaskTombstones(
  userId: string,
  tombstones: TaskTombstones
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      TOMBSTONES_STORAGE_KEY_PREFIX + userId,
      JSON.stringify(tombstones)
    );
  } catch (error) {
    console.warn("Persist task tombstones failed:", error);
  }
}

export function toFirestoreTask(task: Task): Record<string, unknown> {
  const { id: _id, isSynced: _isSynced, ...data } = task;
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

export function fromFirestoreTask(
  id: string,
  data: Record<string, unknown>
): Task {
  return normalizeTask({
    id,
    ...data,
    isSynced: true,
  } as Task);
}

export interface TaskMergeResult {
  tasks: Task[];
  tombstones: TaskTombstones;
}

export function mergeTasks(
  localTasks: Task[],
  remoteTasks: Task[],
  tombstones: TaskTombstones,
  pruneSyncedMissing = true
): TaskMergeResult {
  const remoteById = new Map(remoteTasks.map((task) => [task.id, task]));
  const localIds = new Set(localTasks.map((task) => task.id));
  const nextTombstones: TaskTombstones = { ...tombstones };
  const merged: Task[] = [];

  for (const localTask of localTasks) {
    const remoteTask = remoteById.get(localTask.id);
    const tombstone = nextTombstones[localTask.id];
    const remoteUpdatedAt = timestampMs(remoteTask?.updatedAt);
    const deletedAt = timestampMs(tombstone?.deletedAt);

    if (tombstone) {
      if (remoteTask && remoteUpdatedAt > deletedAt) {
        delete nextTombstones[localTask.id];
      } else {
        nextTombstones[localTask.id] = { ...tombstone, synced: false };
        continue;
      }
    }

    if (!remoteTask) {
      // A synced local task missing from the full remote snapshot was deleted elsewhere.
      if (!localTask.isSynced || !pruneSyncedMissing) merged.push(localTask);
      continue;
    }

    if (!localTask.isSynced) {
      merged.push(localTask);
      continue;
    }

    if (timestampMs(remoteTask.updatedAt) > timestampMs(localTask.updatedAt)) {
      merged.push(remoteTask);
    } else if (timestampMs(localTask.updatedAt) > timestampMs(remoteTask.updatedAt)) {
      merged.push({ ...localTask, isSynced: false });
    } else {
      merged.push(localTask);
    }
  }

  for (const remoteTask of remoteTasks) {
    if (localIds.has(remoteTask.id)) continue;

    const tombstone = nextTombstones[remoteTask.id];
    if (tombstone) {
      if (timestampMs(remoteTask.updatedAt) > timestampMs(tombstone.deletedAt)) {
        delete nextTombstones[remoteTask.id];
      } else {
        nextTombstones[remoteTask.id] = { ...tombstone, synced: false };
        continue;
      }
    }

    merged.push(remoteTask);
  }

  return { tasks: merged, tombstones: nextTombstones };
}
