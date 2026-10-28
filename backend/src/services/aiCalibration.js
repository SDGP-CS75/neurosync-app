/**
 * aiCalibration.js
 *
 * Reads per-category actual/estimated duration ratios from Firestore
 * and returns a formatted string to append to Groq system prompts.
 *
 * Path: users/{uid}/calibration/{category}
 * Each document: { entries: [{ estimated, actual, date }] }
 */

import { getFirestore } from "firebase-admin/firestore";

const MAX_ENTRIES = 20;
const CALIBRATION_CATEGORIES = new Set([
  "Work",
  "Personal",
  "Shopping",
  "Health",
  "Finance",
  "Creative",
  "Other",
]);

// Lazy initialization to ensure Firebase is initialized before getting Firestore
function getDb() {
  return getFirestore();
}

function validDuration(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function normalizeCategory(category) {
  return CALIBRATION_CATEGORIES.has(category) ? category : "Other";
}

export function dedupeCalibrationEntries(entries) {
  const byTask = new Map();

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

/**
 * Compute the average actual/estimated ratio for a set of entries.
 * Returns null if there are fewer than 2 distinct valid task samples.
 */
export function computeRatio(entries) {
  const recent = dedupeCalibrationEntries(entries).slice(-MAX_ENTRIES);
  if (recent.length < 2) return null;

  const totalRatio = recent.reduce((sum, e) => sum + e.actual / e.estimated, 0);
  return totalRatio / recent.length;
}

/**
 * getCalibrationContext(userId)
 *
 * Returns a formatted string like:
 *   "User calibration data (actual vs estimated time by category):
 *    - Work: tasks take 1.4x longer than estimated
 *    - Personal: tasks take 0.9x longer than estimated"
 *
 * Returns empty string if no calibration data exists.
 */
async function getCalibrationContext(userId) {
  if (!userId) return "";

  const db = getDb();

  try {
    const snapshot = await getDb()
      .collection("users")
      .doc(userId)
      .collection("calibration")
      .get();

    if (snapshot.empty) return "";

    const lines = [];

    snapshot.forEach((docSnap) => {
      const category = normalizeCategory(docSnap.id);
      const data = docSnap.data();
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const ratio = computeRatio(entries);

      // Only include categories with meaningful data
      if (ratio !== null) {
        const direction =
          ratio > 1.15
            ? `tasks take ${ratio.toFixed(1)}x longer than estimated`
            : ratio < 0.85
            ? `tasks finish ${(1 / ratio).toFixed(1)}x faster than estimated`
            : "estimates are accurate";

        lines.push(`  - ${category}: ${direction}`);
      }
    });

    if (lines.length === 0) return "";

    return [
      "User calibration data (actual vs estimated time by category):",
      ...lines,
      "Adjust your time estimates accordingly.",
    ].join("\n");
  } catch (e) {
    console.warn("getCalibrationContext failed:", e);
    return "";
  }
}

/**
 * logActualDuration(userId, taskId, category, estimatedMinutes, actualMinutes)
 *
 * Appends a new calibration entry for the given category.
 * Path: users/{uid}/calibration/{category}
 */
async function logActualDuration(
  userId,
  taskId,
  category,
  estimatedMinutes,
  actualMinutes
) {
  if (!userId || !category) return;

  const db = getDb();

  try {
    const safeCategory = normalizeCategory(category);
    const ref = getDb()
      .collection("users")
      .doc(userId)
      .collection("calibration")
      .doc(safeCategory);
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const existing = snap.exists() && Array.isArray(snap.data().entries)
        ? snap.data().entries
        : [];
      const updated = existing
        .filter((entry) => entry?.taskId !== taskId)
        .concat({
          estimated: estimatedMinutes,
          actual: actualMinutes,
          date: new Date().toISOString(),
          taskId,
        })
        .slice(-100);

      transaction.set(
        ref,
        { category: safeCategory, entries: updated },
        { merge: true }
      );
    });
  } catch (e) {
    console.warn("logActualDuration failed:", e);
  }
}

export { getCalibrationContext, logActualDuration };
