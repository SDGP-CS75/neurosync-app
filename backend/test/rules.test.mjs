import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

const projectId = "demo-neurosync";
const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

let testEnv;

const validProfile = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  photoURL: "https://example.com/avatar.png",
  age: "36",
  about: "Mathematician",
  themeName: "ocean",
  hapticFeedback: true,
  createdAt: "2026-10-28T08:00:00.000Z",
};

const validTask = {
  title: "Finish project proposal",
  category: "Work",
  time: "09:00",
  status: "todo",
  dueDate: "2026-10-29T09:00:00.000Z",
  location: "Office",
  reminder: "15",
  reminderSound: "default",
  reminderVibration: "light",
  reminderPriority: "high",
  icon: "briefcase",
  iconBg: "#E8E4FF",
  dateKey: "2026-10-28",
  subtasks: [],
  isSynced: true,
  durationMinutes: 45,
  createdAt: "2026-10-28T08:00:00.000Z",
  updatedAt: "2026-10-28T08:00:00.000Z",
};

const validSession = {
  id: "session-1",
  taskId: null,
  taskTitle: "Finish project proposal",
  startedAt: "2026-10-28T08:00:00.000Z",
  durationMinutes: 25,
  mode: "focus",
  isSynced: true,
};

const validMood = {
  id: "mood-1",
  mood: 3,
  energyLevel: 7,
  note: "Focused",
  tags: ["Work"],
  timestamp: "2026-10-28T08:00:00.000Z",
  isSynced: true,
};

const validTemplate = {
  id: "template-1",
  title: "Weekly review",
  category: "Productivity",
  icon: "clipboard",
  iconBg: "#FFFFFF",
  subtasks: [],
  createdAt: "2026-10-28T08:00:00.000Z",
};

const validCalibration = {
  category: "Work",
  entries: [{ estimatedMinutes: 30, actualMinutes: 45 }],
};

function firestoreFor(userId) {
  return userId
    ? testEnv.authenticatedContext(userId).firestore()
    : testEnv.unauthenticatedContext().firestore();
}

function userPath(userId, ...segments) {
  return doc(firestoreFor(userId), "users", userId, ...segments);
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(`${repositoryRoot}/firestore.rules`, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
    storage: {
      rules: readFileSync(`${repositoryRoot}/storage.rules`, "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });
});

beforeEach(async () => {
  await Promise.all([testEnv.clearFirestore(), testEnv.clearStorage()]);
});

after(async () => {
  await testEnv?.cleanup();
});

describe("Firestore user data rules", () => {
  test("rejects unauthenticated reads and writes", async () => {
    const db = firestoreFor(null);

    await assertFails(getDoc(doc(db, "users/alice/tasks/task-1")));
    await assertFails(
      setDoc(doc(db, "users/alice/tasks/task-1"), validTask)
    );
  });

  test("allows an owner to use every supported user collection", async () => {
    await assertSucceeds(
      setDoc(doc(firestoreFor("alice"), "users/alice"), validProfile)
    );
    await assertSucceeds(
      setDoc(userPath("alice", "tasks", "task-1"), validTask)
    );
    await assertSucceeds(
      setDoc(userPath("alice", "sessions", "session-1"), validSession)
    );
    await assertSucceeds(
      setDoc(userPath("alice", "moods", "mood-1"), validMood)
    );
    await assertSucceeds(
      setDoc(userPath("alice", "templates", "template-1"), validTemplate)
    );
    await assertSucceeds(
      setDoc(userPath("alice", "calibration", "Work"), validCalibration)
    );

    await assertSucceeds(
      getDoc(userPath("alice", "tasks", "task-1"))
    );
    await assertSucceeds(
      getDoc(userPath("alice", "sessions", "session-1"))
    );
    await assertSucceeds(
      getDoc(userPath("alice", "moods", "mood-1"))
    );
  });

  test("blocks cross-user reads, writes, and deletes", async () => {
    await assertSucceeds(
      setDoc(userPath("alice", "tasks", "task-1"), validTask)
    );

    const bobDb = firestoreFor("bob");
    const aliceTaskForBob = doc(bobDb, "users", "alice", "tasks", "task-1");

    await assertFails(getDoc(aliceTaskForBob));
    await assertFails(
      setDoc(aliceTaskForBob, {
        ...validTask,
        title: "Overwritten",
      })
    );
    await assertFails(deleteDoc(aliceTaskForBob));
  });

  test("prevents listing profile documents", async () => {
    const db = firestoreFor("alice");
    await assertFails(getDocs(collection(db, "users")));
  });

  test("rejects malformed task documents", async () => {
    await assertFails(
      setDoc(userPath("alice", "tasks", "bad-status"), {
        ...validTask,
        status: "archived",
      })
    );
    await assertFails(
      setDoc(userPath("alice", "tasks", "bad-date"), {
        ...validTask,
        dateKey: "28-10-2026",
      })
    );
    await assertFails(
      setDoc(userPath("alice", "tasks", "empty-title"), {
        ...validTask,
        title: "",
      })
    );
  });

  test("rejects malformed profile, session, mood, and template documents", async () => {
    await assertFails(
      setDoc(doc(firestoreFor("alice"), "users/alice"), {
        ...validProfile,
        role: "admin",
      })
    );
    await assertFails(
      setDoc(userPath("alice", "sessions", "bad-session"), {
        ...validSession,
        durationMinutes: -1,
      })
    );
    await assertFails(
      setDoc(userPath("alice", "moods", "bad-mood"), {
        ...validMood,
        energyLevel: 11,
      })
    );
    await assertFails(
      setDoc(userPath("alice", "templates", "bad-template"), {
        ...validTemplate,
        title: "",
      })
    );
  });
});

describe("Storage profile photo rules", () => {
  test("allows only the owner to upload, read, and delete an image", async () => {
    const aliceStorage = testEnv.authenticatedContext("alice").storage();
    const bobStorage = testEnv.authenticatedContext("bob").storage();
    const alicePhoto = storageRef(
      aliceStorage,
      "users/alice/profile/avatar.png"
    );
    const bobPhoto = storageRef(
      bobStorage,
      "users/alice/profile/avatar.png"
    );
    const bytes = new Uint8Array([137, 80, 78, 71]);

    await assertSucceeds(
      uploadBytes(alicePhoto, bytes, { contentType: "image/png" })
    );
    await assertSucceeds(getBytes(alicePhoto));
    await assertFails(getBytes(bobPhoto));
    await assertFails(
      uploadBytes(bobPhoto, bytes, { contentType: "image/png" })
    );
    await assertFails(deleteObject(bobPhoto));
    await assertSucceeds(deleteObject(alicePhoto));
  });

  test("rejects non-image uploads and images over 5 MB", async () => {
    const storage = testEnv.authenticatedContext("alice").storage();
    const textFile = storageRef(
      storage,
      "users/alice/profile/notes.txt"
    );
    const oversizedImage = storageRef(
      storage,
      "users/alice/profile/oversized.png"
    );

    await assertFails(
      uploadBytes(textFile, new Uint8Array([1]), {
        contentType: "text/plain",
      })
    );
    await assertFails(
      uploadBytes(oversizedImage, new Uint8Array(5 * 1024 * 1024 + 1), {
        contentType: "image/png",
      })
    );
  });
});
