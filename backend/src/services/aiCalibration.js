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

// Lazy initialization to ensure Firebase is initialized before getting Firestore
function getDb() {
  return getFirestore();
}

/**
 * Compute the average actual/estimated ratio for a set of entries.
 * Returns 1.0 (no adjustment) if there are fewer than 2 data points.
 */
function computeRatio(entries) {
  const valid = entries.filter(
    (e) => typeof e.estimated === "number" && typeof e.actual === "number" && e.estimated > 0
  );
  if (valid.length < 2) return 1.0;

  const recent = valid.slice(-MAX_ENTRIES);
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
      const category = docSnap.id;
      const data = docSnap.data();
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const ratio = computeRatio(entries);

      // Only include categories with meaningful data
      if (entries.length >= 2) {
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
    const ref = getDb()
      .collection("users")
      .doc(userId)
      .collection("calibration")
      .doc(category);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data().entries ?? [] : [];

    const updated = [
      ...existing,
      {
        estimated: estimatedMinutes,
        actual: actualMinutes,
        date: new Date().toISOString(),
        taskId,
      },
    ];

    await setDoc(ref, { entries: updated });
  } catch (e) {
    console.warn("logActualDuration failed:", e);
  }
}

export { getCalibrationContext, logActualDuration };
