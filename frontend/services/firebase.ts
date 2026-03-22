import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Clear any Firebase auth tokens from localStorage on web
// This prevents 400 errors from securetoken.googleapis.com when tokens are invalid/expired
if (Platform.OS === "web" && typeof window !== "undefined") {
  try {
    const firebaseLocalKey = "firebase:authUser:" + firebaseConfig.apiKey + ":[" + firebaseConfig.projectId + "]";
    const stored = localStorage.getItem(firebaseLocalKey);
    if (stored) {
      // Clear any stored token to force fresh authentication
      // This prevents the 400 Bad Request error when trying to refresh invalid tokens
      localStorage.removeItem(firebaseLocalKey);
    }
  } catch (e) {
    // Ignore errors reading localStorage
  }
}

const app = initializeApp(firebaseConfig);

let auth: ReturnType<typeof getAuth>;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    // The RN helper is exported at runtime from firebase/auth, but not typed yet.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require("firebase/auth") as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
    };
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage) as never,
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { auth, db };
