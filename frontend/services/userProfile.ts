import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfileOverrides {
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  about: string;
  age: string;
  themeName?: string;
  hapticFeedback?: boolean;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function splitDisplayName(displayName: string | null): {
  firstName: string;
  lastName: string;
} {
  const parts = clean(displayName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export function fallbackProfileFromUser(
  user: User,
  overrides: UserProfileOverrides = {}
): UserProfileData {
  const fromDisplayName = splitDisplayName(user.displayName);
  return {
    firstName: clean(overrides.firstName) || fromDisplayName.firstName,
    lastName: clean(overrides.lastName) || fromDisplayName.lastName,
    email: clean(overrides.email) || clean(user.email),
    photoURL: clean(overrides.photoURL) || clean(user.photoURL),
    about: "",
    age: "",
  };
}

function normalizeExistingProfile(
  data: Record<string, unknown>,
  fallback: UserProfileData
): UserProfileData {
  return {
    firstName: clean(data.firstName) || fallback.firstName,
    lastName: clean(data.lastName) || fallback.lastName,
    email: clean(data.email) || fallback.email,
    photoURL: clean(data.photoURL) || fallback.photoURL,
    about: clean(data.about),
    age: clean(data.age),
    themeName: clean(data.themeName) || undefined,
    hapticFeedback:
      typeof data.hapticFeedback === "boolean" ? data.hapticFeedback : undefined,
  };
}

/**
 * Loads the user profile, creating or filling missing fields when necessary.
 * Safe to call repeatedly after signup, sign-in, app resume, or reconnect.
 */
export async function ensureUserProfile(
  user: User,
  overrides: UserProfileOverrides = {}
): Promise<UserProfileData> {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const fallback = fallbackProfileFromUser(user, overrides);

  if (!snapshot.exists()) {
    await setDoc(
      ref,
      {
        ...fallback,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    return fallback;
  }

  const existing = (snapshot.data() || {}) as Record<string, unknown>;
  const normalized = normalizeExistingProfile(existing, fallback);
  const updates: Record<string, string> = {};

  for (const field of ["firstName", "lastName", "email", "photoURL"] as const) {
    if (!clean(existing[field]) && normalized[field]) {
      updates[field] = normalized[field];
    }
  }

  if (Object.keys(updates).length > 0) {
    await setDoc(ref, updates, { merge: true });
  }

  return normalized;
}
