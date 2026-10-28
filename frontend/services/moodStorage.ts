import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { MoodEntry } from "../types";

const MOOD_STORAGE_KEY_PREFIX = "@neurosync_mood_entries_";
const LEGACY_MOOD_STORAGE_KEY = "mood_entries";

function parseEntries(raw: string | null): MoodEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is MoodEntry =>
            Boolean(entry) && typeof entry === "object"
        )
      : [];
  } catch {
    return [];
  }
}

function timestampMs(entry: MoodEntry): number {
  const parsed = Date.parse(entry.timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeEntry(entry: MoodEntry, isSynced: boolean): MoodEntry {
  return {
    ...entry,
    isSynced: entry.isSynced ?? isSynced,
  };
}

function sortEntries(entries: MoodEntry[]): MoodEntry[] {
  return [...entries].sort((a, b) => timestampMs(b) - timestampMs(a));
}

function toFirestoreMood(entry: MoodEntry): MoodEntry {
  const { isSynced: _isSynced, ...data } = entry;
  return data;
}

async function saveLocalEntries(
  userId: string,
  entries: MoodEntry[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      MOOD_STORAGE_KEY_PREFIX + userId,
      JSON.stringify(sortEntries(entries))
    );
  } catch (error) {
    console.warn("Failed to cache mood entries:", error);
  }
}

async function getLocalEntries(userId: string): Promise<MoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(MOOD_STORAGE_KEY_PREFIX + userId);
    return parseEntries(raw).map((entry) => normalizeEntry(entry, true));
  } catch {
    return [];
  }
}

function entriesFromSnapshot(
  snapshot: Awaited<ReturnType<typeof getDocs>>
): MoodEntry[] {
  return snapshot.docs.map((document) => {
    const data = document.data() as MoodEntry;
    return normalizeEntry(
      {
        ...data,
        id: document.id || data.id,
      },
      true
    );
  });
}

export function mergeMoodEntries(
  localEntries: MoodEntry[],
  remoteEntries: MoodEntry[],
  pruneSyncedMissing = true
): MoodEntry[] {
  const localById = new Map(localEntries.map((entry) => [entry.id, entry]));
  const remoteById = new Map(remoteEntries.map((entry) => [entry.id, entry]));
  const merged: MoodEntry[] = [];

  for (const localEntry of localEntries) {
    const remoteEntry = remoteById.get(localEntry.id);
    if (localEntry.isSynced === false) {
      merged.push(localEntry);
    } else if (remoteEntry) {
      merged.push(normalizeEntry(remoteEntry, true));
    } else if (!pruneSyncedMissing) {
      merged.push(localEntry);
    }
  }

  for (const remoteEntry of remoteEntries) {
    if (!localById.has(remoteEntry.id)) {
      merged.push(normalizeEntry(remoteEntry, true));
    }
  }

  return sortEntries(merged);
}

async function fetchRemoteEntries(userId: string): Promise<MoodEntry[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "users", userId, "moods"),
        orderBy("timestamp", "desc")
      )
    );
    return entriesFromSnapshot(snapshot);
  } catch {
    const snapshot = await getDocs(collection(db, "users", userId, "moods"));
    return entriesFromSnapshot(snapshot);
  }
}

async function migrateLegacyEntries(userId: string): Promise<MoodEntry[]> {
  const scopedRaw = await AsyncStorage.getItem(MOOD_STORAGE_KEY_PREFIX + userId);
  if (scopedRaw) return [];

  const legacyRaw = await AsyncStorage.getItem(LEGACY_MOOD_STORAGE_KEY);
  const legacyEntries = parseEntries(legacyRaw).map((entry) => ({
    ...entry,
    isSynced: false,
  }));
  if (legacyEntries.length === 0) return [];

  await saveLocalEntries(userId, legacyEntries);
  await AsyncStorage.removeItem(LEGACY_MOOD_STORAGE_KEY);
  return legacyEntries;
}

export async function loadMoodEntries(userId: string): Promise<MoodEntry[]> {
  if (!userId) return [];

  const migratedEntries = await migrateLegacyEntries(userId);
  const localEntries =
    migratedEntries.length > 0
      ? migratedEntries
      : await getLocalEntries(userId);

  try {
    const merged = mergeMoodEntries(
      localEntries,
      await fetchRemoteEntries(userId),
      true
    );
    await saveLocalEntries(userId, merged);
    return merged;
  } catch (error) {
    console.warn("Mood cloud load failed; using local cache:", error);
    return localEntries;
  }
}

export async function saveMoodEntry(
  userId: string,
  entry: MoodEntry
): Promise<void> {
  if (!userId) throw new Error("A signed-in user is required to save moods");

  const pendingEntry = normalizeEntry(entry, false);
  pendingEntry.isSynced = false;
  const localEntries = await getLocalEntries(userId);
  const existingIndex = localEntries.findIndex(
    (localEntry) => localEntry.id === entry.id
  );
  if (existingIndex >= 0) {
    localEntries[existingIndex] = pendingEntry;
  } else {
    localEntries.push(pendingEntry);
  }
  await saveLocalEntries(userId, localEntries);

  try {
    const network = await NetInfo.fetch();
    if (!network.isConnected) return;

    await setDoc(
      doc(db, "users", userId, "moods", entry.id),
      toFirestoreMood(entry)
    );
    await saveLocalEntries(
      userId,
      localEntries.map((localEntry) =>
        localEntry.id === entry.id
          ? { ...localEntry, isSynced: true }
          : localEntry
      )
    );
  } catch (error) {
    console.warn("Mood saved locally and will retry sync:", error);
  }
}

export async function syncPendingMoods(userId: string): Promise<void> {
  if (!userId) return;

  const network = await NetInfo.fetch();
  if (!network.isConnected) return;

  const localEntries = await getLocalEntries(userId);
  const syncedIds = new Set<string>();

  for (const entry of localEntries) {
    if (entry.isSynced !== false) continue;
    try {
      await setDoc(
        doc(db, "users", userId, "moods", entry.id),
        toFirestoreMood(entry)
      );
      syncedIds.add(entry.id);
    } catch (error) {
      console.warn("Mood sync failed:", error);
    }
  }

  if (syncedIds.size === 0) return;
  await saveLocalEntries(
    userId,
    localEntries.map((entry) =>
      syncedIds.has(entry.id) ? { ...entry, isSynced: true } : entry
    )
  );
}

export function getMoodStorageKey(userId: string): string {
  return MOOD_STORAGE_KEY_PREFIX + userId;
}

export async function clearMoodStorageForUser(userId: string): Promise<void> {
  if (!userId) return;
  await AsyncStorage.removeItem(getMoodStorageKey(userId));
}
