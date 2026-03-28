import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { db } from "./firebase";

const SESSIONS_STORAGE_KEY_PREFIX = "@neurosync_sessions_";

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string; // ISO timestamp
  durationMinutes: number;
  mode: "focus" | "break";
  subtaskCompletedId?: string;
  isSynced?: boolean;
}

async function saveSessionsLocally(userId: string, sessions: FocusSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SESSIONS_STORAGE_KEY_PREFIX + userId,
      JSON.stringify(sessions)
    );
  } catch (e) {
    console.warn("saveSessionsLocally failed:", e);
  }
}

async function getLocalSessions(userId: string): Promise<FocusSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function syncSessionsToFirebase(userId: string, sessions: FocusSession[]): Promise<void> {
  const pendingSessions = sessions.filter((session) => !session.isSynced);
  if (pendingSessions.length === 0) return;

  for (const session of pendingSessions) {
    try {
      await setDoc(
        doc(db, "users", userId, "sessions", session.id),
        session
      );
      session.isSynced = true;
    } catch (e) {
      console.log("Session sync failed:", e);
    }
  }

  await saveSessionsLocally(userId, sessions);
}

/**
 * Write a focus session to Firestore.
 * Path: users/{uid}/sessions/{session.id}
 */
export async function writeSession(
  userId: string,
  session: FocusSession
): Promise<void> {
  if (!userId) {
    console.warn("writeSession: no userId provided");
    return;
  }

  const sessionWithSync = { ...session, isSynced: false };

  // Save locally first
  const localSessions = await getLocalSessions(userId);
  const existingIndex = localSessions.findIndex((s) => s.id === session.id);
  if (existingIndex >= 0) {
    localSessions[existingIndex] = sessionWithSync;
  } else {
    localSessions.push(sessionWithSync);
  }
  await saveSessionsLocally(userId, localSessions);

  // Try to sync to Firebase if online
  try {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      await setDoc(
        doc(db, "users", userId, "sessions", session.id),
        session
      );
      sessionWithSync.isSynced = true;
      await saveSessionsLocally(userId, localSessions);
      console.log("Session saved successfully:", session.id);
    } else {
      console.log("Session saved locally (offline):", session.id);
    }
  } catch (e) {
    console.error("writeSession failed:", e);
    // Don't throw - we don't want to interrupt the user flow if saving fails
  }
}

/**
 * Get all sessions for a user, sorted by startedAt descending.
 * Path: users/{uid}/sessions
 */
export async function getSessions(userId: string): Promise<FocusSession[]> {
  try {
    // First try with ordering
    const q = query(
      collection(db, "users", userId, "sessions"),
      orderBy("startedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map((d) => d.data() as FocusSession);
    // Save to local storage
    await saveSessionsLocally(userId, sessions);
    return sessions;
  } catch (e) {
    console.warn("getSessions failed with ordering, trying without:", e);
    // Fallback: try without ordering if index doesn't exist
    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "sessions")
      );
      const sessions = snapshot.docs.map((d) => d.data() as FocusSession);
      // Sort manually
      const sorted = sessions.sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      // Save to local storage
      await saveSessionsLocally(userId, sorted);
      return sorted;
    } catch (fallbackError) {
      console.warn("getSessions fallback also failed:", fallbackError);
      // Return local sessions if Firebase fails
      return await getLocalSessions(userId);
    }
  }
}

/**
 * Get all sessions for a specific task, sorted by startedAt descending.
 * Path: users/{uid}/sessions (filtered by taskId)
 */
export async function getSessionsForTask(
  userId: string,
  taskId: string
): Promise<FocusSession[]> {
  try {
    const q = query(
      collection(db, "users", userId, "sessions"),
      where("taskId", "==", taskId),
      orderBy("startedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map((d) => d.data() as FocusSession);
    // Save to local storage
    await saveSessionsLocally(userId, sessions);
    return sessions;
  } catch (e) {
    console.warn("getSessionsForTask failed:", e);
    // Fallback: get all and filter manually
    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "sessions")
      );
      const sessions = snapshot.docs
        .map((d) => d.data() as FocusSession)
        .filter((s) => s.taskId === taskId);
      const sorted = sessions.sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      // Save to local storage
      await saveSessionsLocally(userId, sorted);
      return sorted;
    } catch (fallbackError) {
      console.warn("getSessionsForTask fallback also failed:", fallbackError);
      // Return local sessions if Firebase fails
      const localSessions = await getLocalSessions(userId);
      return localSessions.filter((s) => s.taskId === taskId);
    }
  }
}

/**
 * Sync all pending sessions to Firebase
 */
export async function syncPendingSessions(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const localSessions = await getLocalSessions(userId);
    await syncSessionsToFirebase(userId, localSessions);
  } catch (e) {
    console.log("syncPendingSessions failed:", e);
  }
}