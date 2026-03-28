import { getDocs, setDoc } from "firebase/firestore";

import {
  getSessions,
  getSessionsForTask,
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

describe("session storage service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      { id: "session-2", startedAt: "2026-03-27T00:00:00.000Z" },
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
      },
    ]);
  });
});
