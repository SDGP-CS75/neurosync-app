import {
  getDocs,
  runTransaction,
} from "firebase/firestore";

import {
  calculateCalibrationMultiplier,
  dedupeCalibrationEntries,
  getCalibrationMultipliers,
  logActualDuration,
} from "../../services/calibration";

jest.mock("../../services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  runTransaction: jest.fn(),
}));

describe("calibration service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates one calibration sample per task", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      }),
      set: jest.fn(),
    };
    (runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      await callback(transaction);
    });

    await logActualDuration("user-1", "task-1", "Work", 30, 45);

    expect(transaction.set).toHaveBeenCalledWith(
      undefined,
      {
        category: "Work",
        entries: [expect.objectContaining({
          taskId: "task-1",
          estimated: 30,
          actual: 45,
        })],
      },
      { merge: true }
    );
  });

  it("replaces cumulative samples for the same task", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({
          entries: [
            { taskId: "task-1", estimated: 30, actual: 20, date: "old" },
            { taskId: "task-2", estimated: 15, actual: 20, date: "old" },
          ],
        }),
      }),
      set: jest.fn(),
    };
    (runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      await callback(transaction);
    });

    await logActualDuration("user-1", "task-1", "Work", 30, 45);

    expect(transaction.set).toHaveBeenCalledWith(
      undefined,
      {
        category: "Work",
        entries: [
          expect.objectContaining({ taskId: "task-2" }),
          expect.objectContaining({ taskId: "task-1", actual: 45 }),
        ],
      },
      { merge: true }
    );
  });

  it("computes category multipliers from calibration entries", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (callback: (doc: { id: string; data: () => unknown }) => void) =>
        callback({
          id: "Work",
          data: () => ({
            category: "Work",
            entries: [
              { estimated: 20, actual: 30 },
              { estimated: 10, actual: 10 },
            ],
          }),
        }),
    });

    await expect(getCalibrationMultipliers("user-1")).resolves.toEqual({
      Work: 1.25,
    });
  });

  it("deduplicates legacy task samples and ignores invalid rows", () => {
    const entries = [
      { taskId: "task-1", estimated: 10, actual: 30, date: "first" },
      { taskId: "task-1", estimated: 10, actual: 20, date: "latest" },
      { taskId: "task-2", estimated: 0, actual: 20, date: "invalid" },
      { taskId: "task-3", estimated: 20, actual: 20, date: "valid" },
    ];

    expect(dedupeCalibrationEntries(entries)).toEqual([
      entries[1],
      entries[3],
    ]);
    expect(calculateCalibrationMultiplier(entries)).toBe(1.5);
  });

  it("requires two valid task samples before producing a multiplier", () => {
    expect(
      calculateCalibrationMultiplier([
        { taskId: "task-1", estimated: 10, actual: 20, date: "only" },
      ])
    ).toBeNull();
  });
});
