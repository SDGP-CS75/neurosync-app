import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { getDocs, setDoc } from "firebase/firestore";

import {
  getSessions,
  getSessionsForTask,
  syncPendingSessions,
  writeSession,
} from "../../services/sessionStorage";

jest.mock("../../services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
  },
}));

describe("session storage service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it("writes a session for a signed-in user", async () => {
    await writeSession("user-1", {
      id: "session-1",
      taskId: "task-1",
      taskTitle: "Write report",
      startedAt: "2026-03-26T00:00:00.000Z",
      durationMinutes: 25,
      mode: "focus",
    });

    expect(setDoc).toHaveBeenCalled();
  });

  it("returns sessions in descending order", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({
            id: "session-2",
            startedAt: "2026-03-27T00:00:00.000Z",
          }),
        },
      ],
    });

    await expect(getSessions("user-1")).resolves.toEqual([
      {
        id: "session-2",
        startedAt: "2026-03-27T00:00:00.000Z",
        isSynced: true,
      },
    ]);
  });

  it("filters task sessions when the query succeeds", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({
            id: "session-3",
            taskId: "task-1",
            startedAt: "2026-03-26T00:00:00.000Z",
          }),
        },
      ],
    });

    await expect(getSessionsForTask("user-1", "task-1")).resolves.toEqual([
      {
        id: "session-3",
        taskId: "task-1",
        startedAt: "2026-03-26T00:00:00.000Z",
        isSynced: true,
      },
    ]);
  });

  it("preserves an unsynced local session when loading remote sessions", async () => {
    const localSession = {
      id: "local-session",
      taskId: null,
      taskTitle: null,
      startedAt: "2026-03-28T00:00:00.000Z",
      durationMinutes: 25,
      mode: "focus" as const,
      isSynced: false,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([localSession])
    );
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "remote-session",
          data: () => ({
            id: "remote-session",
            taskId: null,
            taskTitle: null,
            startedAt: "2026-03-27T00:00:00.000Z",
            durationMinutes: 50,
            mode: "focus",
          }),
        },
      ],
    });

    const sessions = await getSessions("user-1");

    expect(sessions.map((session) => session.id)).toEqual([
      "local-session",
      "remote-session",
    ]);
    expect(sessions[0].isSynced).toBe(false);
  });

  it("does not discard unrelated cached sessions for a task query", async () => {
    const unrelatedSession = {
      id: "other-session",
      taskId: "task-2",
      taskTitle: "Other task",
      startedAt: "2026-03-25T00:00:00.000Z",
      durationMinutes: 25,
      mode: "focus" as const,
      isSynced: true,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([unrelatedSession])
    );
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "task-session",
          data: () => ({
            id: "task-session",
            taskId: "task-1",
            taskTitle: "Write report",
            startedAt: "2026-03-26T00:00:00.000Z",
            durationMinutes: 25,
            mode: "focus",
          }),
        },
      ],
    });

    const sessions = await getSessionsForTask("user-1", "task-1");

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("task-session");
    const persisted = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1]
    );
    expect(persisted.map((session: { id: string }) => session.id)).toEqual(
      expect.arrayContaining(["other-session", "task-session"])
    );
  });

  it("retries pending sessions and marks only successful writes as synced", async () => {
    const pendingSession = {
      id: "pending-session",
      taskId: null,
      taskTitle: null,
      startedAt: "2026-03-28T00:00:00.000Z",
      durationMinutes: 25,
      mode: "focus" as const,
      isSynced: false,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([pendingSession])
    );

    await syncPendingSessions("user-1");

    expect(setDoc).toHaveBeenCalledWith(undefined, {
      id: "pending-session",
      taskId: null,
      taskTitle: null,
      startedAt: "2026-03-28T00:00:00.000Z",
      durationMinutes: 25,
      mode: "focus",
    });
    const persisted = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1]
    );
    expect(persisted[0].isSynced).toBe(true);
  });
});
