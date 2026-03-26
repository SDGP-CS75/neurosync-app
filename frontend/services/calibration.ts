import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

interface CalibrationEntry {
  taskId: string;
  estimated: number;
  actual: number;
  date: string; // ISO timestamp
}

/**
 * Log actual vs estimated duration for a completed task.
 * Path: users/{uid}/calibration/{category}
 *
 * Uses arrayUnion so concurrent writes don't overwrite each other.
 */
export async function logActualDuration(
  userId: string,
  taskId: string,
  category: string,
  estimatedMinutes: number,
  actualMinutes: number
): Promise<void> {
  // Skip logging if either value is zero or nonsensical
  if (estimatedMinutes <= 0 || actualMinutes <= 0) return;

  const entry: CalibrationEntry = {
    taskId,
    estimated: estimatedMinutes,
    actual: actualMinutes,
    date: new Date().toISOString(),
  };

  try {
    const ref = doc(db, "users", userId, "calibration", category);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // Doc exists — append the new entry
      await updateDoc(ref, {
        entries: arrayUnion(entry),
      });
    } else {
      // Doc doesn't exist yet — create it with the first entry
      await setDoc(ref, {
        category,
        entries: [entry],
      });
    }
  } catch (e) {
    console.warn("logActualDuration failed:", e);
  }
}

/**
 * Read all calibration docs and compute the average actual/estimated
 * ratio per category over the last 20 entries.
 *
 * Returns e.g. { Creative: 1.4, Work: 0.9, Health: 1.0 }
 * A value of 1.0 means the AI estimates are accurate for that category.
 * A value of 1.4 means the user takes 40% longer than estimated.
 */
export async function getCalibrationMultipliers(
  userId: string
): Promise<Record<string, number>> {
  const multipliers: Record<string, number> = {};

  try {
    const snapshot = await getDocs(
      collection(db, "users", userId, "calibration")
    );

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const category: string = data.category ?? docSnap.id;
      const entries: CalibrationEntry[] = Array.isArray(data.entries)
        ? data.entries
        : [];

      if (entries.length === 0) return;

      // Take only the most recent 20 entries
      const recent = entries.slice(-20);

      // Compute average ratio: actual / estimated
      const totalRatio = recent.reduce((sum, e) => {
        if (e.estimated <= 0) return sum;
        return sum + e.actual / e.estimated;
      }, 0);

      const avgRatio = totalRatio / recent.length;

      // Only store if we have a meaningful ratio
      if (Number.isFinite(avgRatio) && avgRatio > 0) {
        multipliers[category] = parseFloat(avgRatio.toFixed(2));
      }
    });
  } catch (e) {
    console.warn("getCalibrationMultipliers failed:", e);
  }

  return multipliers;
}