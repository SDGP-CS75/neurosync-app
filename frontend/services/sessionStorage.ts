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
import type { FocusSession } from "../types";

const SESSIONS_STORAGE_KEY_PREFIX = "@neurosync_sessions_";

export type { FocusSession };

function normalizeSession(session: FocusSession): FocusSession {
  return {
    ...session,
    isSynced: session.isSynced !== false,
  };
}

function toFirestoreSession(session: FocusSession): FocusSession {
  const { isSynced: _isSynced, ...data } = session;
  return data;
}

function sortSessions(sessions: FocusSession[]): FocusSession[] {
  return [...sessions].sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function mergeSessions(
  localSessions: FocusSession[],
  remoteSessions: FocusSession[],
  pruneSyncedMissing = true
): FocusSession[] {
  const localById = new Map(localSessions.map((session) => [session.id, session]));
  const remoteById = new Map(
    remoteSessions.map((session) => [session.id, normalizeSession(session)])
  );
  const merged: FocusSession[] = [];

  for (const localSession of localSessions) {
    const remoteSession = remoteById.get(localSession.id);
    if (localSession.isSynced === false) {
      merged.push(localSession);
    } else if (remoteSession) {
      merged.push(remoteSession);
    } else if (!pruneSyncedMissing) {
      merged.push(localSession);
    }
  }

  for (const remoteSession of remoteSessions) {
    if (!localById.has(remoteSession.id)) {
      merged.push(normalizeSession(remoteSession));
    }
  }

  return sortSessions(merged);
}

export async function clearSessionStorageForUser(
  userId: string
): Promise<void> {
  if (!userId) return;
  await AsyncStorage.removeItem(SESSIONS_STORAGE_KEY_PREFIX + userId);
}

async function saveSessionsLocally(
  userId: string,
  sessions: FocusSession[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SESSIONS_STORAGE_KEY_PREFIX + userId,
      JSON.stringify(sortSessions(sessions))
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
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (session): session is FocusSession =>
              Boolean(session) && typeof session === "object"
          )
          .map(normalizeSession)
      : [];
  } catch {
    return [];
  }
}

function sessionsFromSnapshot(
  snapshot: Awaited<ReturnType<typeof getDocs>>
): FocusSession[] {
  return snapshot.docs.map((document) => {
    const data = document.data() as FocusSession;
    return normalizeSession({
      ...data,
      id: document.id || data.id,
      isSynced: true,
    });
  });
}

async function syncSessionsToFirebase(
  userId: string,
  sessions: FocusSession[]
): Promise<FocusSession[]> {
  const pendingSessions = sessions.filter((session) => session.isSynced === false);
  if (pendingSessions.length === 0) return sessions;

  const syncedIds = new Set<string>();
  for (const session of pendingSessions) {
    try {
      await setDoc(
        doc(db, "users", userId, "sessions", session.id),
        toFirestoreSession(session)
      );
      syncedIds.add(session.id);
    } catch (e) {
      console.log("Session sync failed:", e);
    }
  }

  const nextSessions = sessions.map((session) =>
    syncedIds.has(session.id) ? { ...session, isSynced: true } : session
  );
  await saveSessionsLocally(userId, nextSessions);
  return nextSessions;
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
        toFirestoreSession(session)
      );
      const syncedSessions = localSessions.map((localSession) =>
        localSession.id === session.id
          ? { ...localSession, isSynced: true }
          : localSession
      );
      await saveSessionsLocally(userId, syncedSessions);
    }
  } catch (e) {
    console.warn("Session saved locally and will retry sync:", e);
  }
}

/**
 * Get all sessions for a user, sorted by startedAt descending.
 * Path: users/{uid}/sessions
 */
export async function getSessions(userId: string): Promise<FocusSession[]> {
  const localSessions = await getLocalSessions(userId);

  try {
    const q = query(
      collection(db, "users", userId, "sessions"),
      orderBy("startedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const merged = mergeSessions(
      localSessions,
      sessionsFromSnapshot(snapshot),
      true
    );
    await saveSessionsLocally(userId, merged);
    return merged;
  } catch (e) {
    console.warn("getSessions failed with ordering, trying without:", e);
    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "sessions")
      );
      const merged = mergeSessions(
        localSessions,
        sessionsFromSnapshot(snapshot),
        true
      );
      await saveSessionsLocally(userId, merged);
      return merged;
    } catch (fallbackError) {
      console.warn("getSessions fallback also failed:", fallbackError);
      return localSessions;
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
  const localSessions = await getLocalSessions(userId);

  try {
    const q = query(
      collection(db, "users", userId, "sessions"),
      where("taskId", "==", taskId),
      orderBy("startedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const merged = mergeSessions(
      localSessions,
      sessionsFromSnapshot(snapshot),
      false
    );
    await saveSessionsLocally(userId, merged);
    return merged.filter((session) => session.taskId === taskId);
  } catch (e) {
    console.warn("getSessionsForTask failed:", e);
    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "sessions")
      );
      const merged = mergeSessions(
        localSessions,
        sessionsFromSnapshot(snapshot),
        true
      );
      await saveSessionsLocally(userId, merged);
      return merged.filter((session) => session.taskId === taskId);
    } catch (fallbackError) {
      console.warn("getSessionsForTask fallback also failed:", fallbackError);
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
