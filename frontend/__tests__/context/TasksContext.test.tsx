import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { act, render, waitFor } from "@testing-library/react-native";
import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import React from "react";

import { TasksProvider, useTasks } from "../../context/TasksContext";
import type { Task } from "../../types";

jest.unmock("../../context/TasksContext");

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(),
  },
}));

jest.mock("../../services/notifications", () => ({
  cancelTaskNotification: jest.fn().mockResolvedValue(undefined),
  rescheduleAllNotifications: jest.fn().mockResolvedValue(undefined),
  scheduleRecurringNotification: jest.fn().mockResolvedValue(undefined),
  scheduleTaskNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/calibration", () => ({
  logActualDuration: jest.fn().mockResolvedValue(undefined),
}));

const storedTask: Task = {
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
};

let latestContext: ReturnType<typeof useTasks>;

function ContextProbe() {
  latestContext = useTasks();
  return null;
}

function renderProvider() {
  return render(
    <TasksProvider>
      <ContextProbe />
    </TasksProvider>
  );
}

describe("TasksProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (onAuthStateChanged as jest.Mock).mockImplementation(
      (_auth: unknown, callback: (user: { uid: string } | null) => void) => {
        callback({ uid: "user-1" });
        return jest.fn();
      }
    );
    (onSnapshot as jest.Mock).mockReturnValue(jest.fn());
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it("keeps a failed local write pending for a later retry", async () => {
    (setDoc as jest.Mock).mockRejectedValue(new Error("offline"));
    renderProvider();

    await waitFor(() => expect(latestContext.isLoading).toBe(false));
    act(() => {
      latestContext.addTask({
        ...storedTask,
        title: "Offline edit",
        isSynced: false,
      });
    });

    await waitFor(() => expect(setDoc).toHaveBeenCalled());
    expect(latestContext.tasks[0]).toMatchObject({
      title: "Offline edit",
      isSynced: false,
    });
    expect(latestContext.tasks[0].updatedAt).toBeTruthy();
  });

  it("persists deletion immediately and restores the task on undo", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "@neurosync_tasks_user-1") {
        return Promise.resolve(JSON.stringify([storedTask]));
      }
      return Promise.resolve(null);
    });
    renderProvider();

    await waitFor(() => expect(latestContext.tasks).toHaveLength(1));
    act(() => latestContext.removeTask(storedTask.id));

    expect(latestContext.tasks).toEqual([]);
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@neurosync_task_tombstones_user-1",
        expect.stringContaining(storedTask.id)
      )
    );

    act(() => latestContext.undoDelete(storedTask));

    expect(latestContext.tasks[0]).toMatchObject({
      id: storedTask.id,
      isSynced: false,
    });
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@neurosync_task_tombstones_user-1",
        "{}"
      )
    );
  });
});
