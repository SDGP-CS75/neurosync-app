import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearTaskStorageForUser,
  fromFirestoreTask,
  loadTaskTombstones,
  loadTasksForUser,
  mergeTasks,
  normalizeTask,
  saveTaskTombstones,
  toFirestoreTask,
  type TaskTombstones,
} from "../../services/taskStorage";
import type { Task } from "../../types";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    category: "Work",
    title: "Write report",
    status: "todo",
    icon: "document",
    iconBg: "#dbeafe",
    dateKey: "2026-10-28",
    isSynced: true,
    createdAt: "2026-10-28T08:00:00.000Z",
    updatedAt: "2026-10-28T09:00:00.000Z",
    ...overrides,
  };
}

describe("task storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preserves an unsynced local edit when the remote copy is newer", () => {
    const local = task({
      title: "Offline title",
      isSynced: false,
      updatedAt: "2026-10-28T09:00:00.000Z",
    });
    const remote = task({
      title: "Remote title",
      updatedAt: "2026-10-28T10:00:00.000Z",
    });

    expect(mergeTasks([local], [remote], {}).tasks).toEqual([local]);
  });

  it("keeps an unsynced local task when a remote snapshot omits it", () => {
    const local = task({ isSynced: false });

    expect(mergeTasks([local], [], {}, true).tasks).toEqual([local]);
  });

  it("prunes a synced local task missing from a complete remote snapshot", () => {
    const local = task({ isSynced: true });

    expect(mergeTasks([local], [], {}, true).tasks).toEqual([]);
    expect(mergeTasks([local], [], {}, false).tasks).toEqual([local]);
  });

  it("applies a newer remote update to a synced local task", () => {
    const local = task();
    const remote = task({
      title: "Updated remotely",
      updatedAt: "2026-10-28T10:00:00.000Z",
    });

    expect(mergeTasks([local], [remote], {}).tasks).toEqual([remote]);
  });

  it("keeps a deletion tombstone ahead of an older remote task", () => {
    const remote = task({ updatedAt: "2026-10-28T09:00:00.000Z" });
    const tombstones: TaskTombstones = {
      "task-1": {
        deletedAt: "2026-10-28T10:00:00.000Z",
        synced: true,
      },
    };

    const result = mergeTasks([], [remote], tombstones);

    expect(result.tasks).toEqual([]);
    expect(result.tombstones["task-1"].synced).toBe(false);
  });

  it("accepts a remote recreation newer than the deletion", () => {
    const remote = task({ updatedAt: "2026-10-28T11:00:00.000Z" });
    const tombstones: TaskTombstones = {
      "task-1": {
        deletedAt: "2026-10-28T10:00:00.000Z",
        synced: true,
      },
    };

    const result = mergeTasks([], [remote], tombstones);

    expect(result.tasks).toEqual([remote]);
    expect(result.tombstones).toEqual({});
  });

  it("loads only unexpired tombstones", async () => {
    const now = new Date("2026-10-28T12:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        expired: {
          deletedAt: "2026-09-01T00:00:00.000Z",
          synced: false,
        },
        recent: {
          deletedAt: "2026-10-27T12:00:00.000Z",
          synced: true,
        },
      })
    );

    await expect(loadTaskTombstones("user-1")).resolves.toEqual({
      recent: {
        deletedAt: "2026-10-27T12:00:00.000Z",
        synced: true,
      },
    });

    jest.useRealTimers();
  });

  it("scopes persisted tasks and tombstones to the signed-in user", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("[]");

    await loadTasksForUser("user-1");
    await saveTaskTombstones("user-1", {});

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      "@neurosync_tasks_user-1"
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@neurosync_task_tombstones_user-1",
      "{}"
    );
  });

  it("clears only the signed-in user's task cache and tombstones", async () => {
    await clearTaskStorageForUser("user-1");

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      "@neurosync_tasks_user-1",
      "@neurosync_task_tombstones_user-1",
    ]);
  });

  it("normalizes legacy tasks and strips local-only fields before syncing", () => {
    const normalized = normalizeTask({
      ...task(),
      updatedAt: undefined,
      isSynced: undefined as unknown as boolean,
    });
    const firestoreTask = toFirestoreTask({
      ...normalized,
      pendingSync: true,
    });
    const remoteTask = fromFirestoreTask("task-2", {
      title: "Remote",
      category: "Work",
      status: "todo",
      icon: "document",
      iconBg: "#dbeafe",
      dateKey: "2026-10-28",
      updatedAt: "2026-10-28T10:00:00.000Z",
    });

    expect(normalized.updatedAt).toBe(normalized.createdAt);
    expect(normalized.isSynced).toBe(false);
    expect(firestoreTask).not.toHaveProperty("id");
    expect(firestoreTask).not.toHaveProperty("isSynced");
    expect(remoteTask.isSynced).toBe(true);
    expect(remoteTask.id).toBe("task-2");
  });
});
