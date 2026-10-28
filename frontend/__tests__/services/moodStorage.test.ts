import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { getDocs, setDoc } from "firebase/firestore";

import {
  loadMoodEntries,
  mergeMoodEntries,
  saveMoodEntry,
  syncPendingMoods,
} from "../../services/moodStorage";
import type { MoodEntry } from "../../types";

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
}));

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
  },
}));

function mood(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: "mood-1",
    mood: 3,
    energyLevel: 6,
    timestamp: "2026-10-28T09:00:00.000Z",
    isSynced: true,
    ...overrides,
  };
}

describe("mood storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
  });

  it("keeps unsynced local moods and accepts remote entries", () => {
    const local = mood({
      id: "local",
      timestamp: "2026-10-28T08:00:00.000Z",
      isSynced: false,
    });
    const remote = mood({ id: "remote", mood: 4 });

    expect(mergeMoodEntries([local], [remote])).toEqual([
      remote,
      local,
    ]);
  });

  it("drops a synced local cache entry removed from the cloud", () => {
    expect(mergeMoodEntries([mood()], [], true)).toEqual([]);
    expect(mergeMoodEntries([mood()], [], false)).toHaveLength(1);
  });

  it("saves locally before syncing a mood to Firestore", async () => {
    await saveMoodEntry("user-1", mood({ id: "new-mood" }));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@neurosync_mood_entries_user-1",
      expect.stringContaining("new-mood")
    );
    expect(setDoc).toHaveBeenCalledWith(undefined, {
      id: "new-mood",
      mood: 3,
      energyLevel: 6,
      timestamp: "2026-10-28T09:00:00.000Z",
    });
    expect(
      JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1])[0]
        .isSynced
    ).toBe(true);
  });

  it("leaves a mood pending when the remote write fails", async () => {
    (setDoc as jest.Mock).mockRejectedValue(new Error("offline"));

    await saveMoodEntry("user-1", mood({ id: "pending" }));

    expect(
      JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1])[0]
        .isSynced
    ).toBe(false);
  });

  it("retries pending moods without duplicating synced entries", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([
        mood({ id: "pending", isSynced: false }),
        mood({ id: "synced", isSynced: true }),
      ])
    );

    await syncPendingMoods("user-1");

    expect(setDoc).toHaveBeenCalledTimes(1);
    const persisted = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1]
    );
    expect(persisted.find((entry: MoodEntry) => entry.id === "pending").isSynced)
      .toBe(true);
  });

  it("migrates the legacy shared cache once into the current user's scope", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "mood_entries") {
        return Promise.resolve(JSON.stringify([mood({ id: "legacy" })]));
      }
      return Promise.resolve(null);
    });

    const entries = await loadMoodEntries("user-1");

    expect(entries[0].id).toBe("legacy");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("mood_entries");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@neurosync_mood_entries_user-1",
      expect.stringContaining("legacy")
    );
  });
});
