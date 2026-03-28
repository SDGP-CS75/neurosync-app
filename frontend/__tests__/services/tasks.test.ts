import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";

import { clearLocalTasks, createTask } from "../../services/tasks";

jest.mock("../../services/firebase", () => ({
  db: {},
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  updateDoc: jest.fn(),
}));

describe("tasks service", () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as typeof fetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockRejectedValue(new Error("offline"));
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("[]");
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it("creates a local task when the user is signed out", async () => {
    const task = await createTask({ title: "Write tests" });

    expect(task.id).toMatch(/^local_/);
    expect(task.title).toBe("Write tests");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "offline_tasks",
      expect.stringContaining("\"title\":\"Write tests\"")
    );
  });

  it("clears locally cached tasks", async () => {
    await clearLocalTasks();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("offline_tasks");
  });
});
