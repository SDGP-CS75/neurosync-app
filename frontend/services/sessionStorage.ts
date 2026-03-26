import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string; // ISO timestamp
  durationMinutes: number;
  mode: "focus" | "break";
  subtaskCompletedId?: string;
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
  try {
    await setDoc(
      doc(db, "users", userId, "sessions", session.id),
      session
    );
    console.log("Session saved successfully:", session.id);
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
    return snapshot.docs.map((d) => d.data() as FocusSession);
  } catch (e) {
    console.warn("getSessions failed with ordering, trying without:", e);
    // Fallback: try without ordering if index doesn't exist
    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "sessions")
      );
      const sessions = snapshot.docs.map((d) => d.data() as FocusSession);
      // Sort manually
      return sessions.sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    } catch (fallbackError) {
      console.warn("getSessions fallback also failed:", fallbackError);
      return [];
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
    return snapshot.docs.map((d) => d.data() as FocusSession);
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
      return sessions.sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    } catch (fallbackError) {
      console.warn("getSessionsForTask fallback also failed:", fallbackError);
      return [];
    }
  }
}