import {
  collection,
  doc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";

export interface CalibrationEntry {
  taskId: string;
  estimated: number;
  actual: number;
  date: string; // ISO timestamp
}

const CALIBRATION_CATEGORIES = new Set([
  "Work",
  "Personal",
  "Shopping",
  "Health",
  "Finance",
  "Creative",
  "Other",
]);

const MAX_STORED_ENTRIES = 100;
const MAX_RATIO_ENTRIES = 20;

function normalizeCategory(category: string): string {
  return CALIBRATION_CATEGORIES.has(category) ? category : "Other";
}

function validDuration(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function dedupeCalibrationEntries(
  entries: CalibrationEntry[]
): CalibrationEntry[] {
  const byTask = new Map<string, CalibrationEntry>();

  entries.forEach((entry, index) => {
    if (
      !entry ||
      !validDuration(entry.estimated) ||
      !validDuration(entry.actual)
    ) {
      return;
    }
    const key =
      typeof entry.taskId === "string" && entry.taskId.length > 0
        ? entry.taskId
        : `legacy-${index}`;
    byTask.set(key, entry);
  });

  return Array.from(byTask.values());
}

export function calculateCalibrationMultiplier(
  entries: CalibrationEntry[]
): number | null {
  const recent = dedupeCalibrationEntries(entries).slice(-MAX_RATIO_ENTRIES);
  if (recent.length < 2) return null;

  const average =
    recent.reduce((sum, entry) => sum + entry.actual / entry.estimated, 0) /
    recent.length;
  return Number.isFinite(average) && average > 0
    ? Number(average.toFixed(2))
    : null;
}

/**
 * Log actual vs estimated duration for a completed task.
 * Path: users/{uid}/calibration/{category}
 *
 * One sample is kept per task. Updating a task's accumulated focus time
 * replaces its previous sample instead of appending cumulative duplicates.
 */
export async function logActualDuration(
  userId: string,
  taskId: string,
  category: string,
  estimatedMinutes: number,
  actualMinutes: number
): Promise<void> {
  if (
    !userId ||
    !taskId ||
    !validDuration(estimatedMinutes) ||
    !validDuration(actualMinutes)
  ) {
    return;
  }

  const entry: CalibrationEntry = {
    taskId,
    estimated: estimatedMinutes,
    actual: actualMinutes,
    date: new Date().toISOString(),
  };

  try {
    const safeCategory = normalizeCategory(category);
    const ref = doc(db, "users", userId, "calibration", safeCategory);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      const existing = snap.exists() && Array.isArray(snap.data().entries)
        ? (snap.data().entries as CalibrationEntry[])
        : [];
      const entries = existing
        .filter((item) => item?.taskId !== taskId)
        .concat(entry)
        .slice(-MAX_STORED_ENTRIES);

      transaction.set(
        ref,
        { category: safeCategory, entries },
        { merge: true }
      );
    });
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
      const category = normalizeCategory(data.category ?? docSnap.id);
      const entries: CalibrationEntry[] = Array.isArray(data.entries)
        ? data.entries
        : [];
      const multiplier = calculateCalibrationMultiplier(entries);
      if (multiplier !== null) multipliers[category] = multiplier;
    });
  } catch (e) {
    console.warn("getCalibrationMultipliers failed:", e);
  }

  return multipliers;
}
