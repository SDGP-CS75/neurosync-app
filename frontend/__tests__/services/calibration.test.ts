import {
  arrayUnion,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  getCalibrationMultipliers,
  logActualDuration,
} from "../../services/calibration";

jest.mock("../../services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  arrayUnion: jest.fn((value) => ({ __arrayUnion: value })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe("calibration service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a calibration document when one does not exist", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    await logActualDuration("user-1", "task-1", "Work", 30, 45);

    expect(setDoc).toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("updates an existing calibration document", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
    });

    await logActualDuration("user-1", "task-1", "Work", 30, 45);

    expect(arrayUnion).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
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
});
