import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
import { clearTaskStorageForUser } from './taskStorage';

const SESSIONS_STORAGE_KEY_PREFIX = '@neurosync_sessions_';
const MOOD_ENTRIES_KEY = 'mood_entries';

/**
 * Reset all user data from Firebase and local storage
 * This includes:
 * - Tasks (Firebase + local)
 * - Sessions (Firebase + local)
 * - Mood entries (local only)
 * - Calibration data (Firebase)
 */
export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    // Clear Firebase data if user is logged in
    if (user) {
      const userId = user.uid;

      // Delete all tasks from Firebase
      try {
        const tasksSnapshot = await getDocs(collection(db, 'users', userId, 'tasks'));
        const taskDeletePromises = tasksSnapshot.docs.map((taskDoc) =>
          deleteDoc(doc(db, 'users', userId, 'tasks', taskDoc.id))
        );
        await Promise.all(taskDeletePromises);
        console.log('Firebase tasks deleted successfully');
      } catch (error) {
        console.error('Error deleting Firebase tasks:', error);
        return { success: false, error: 'Failed to delete tasks from cloud' };
      }

      // Delete all sessions from Firebase
      try {
        const sessionsSnapshot = await getDocs(collection(db, 'users', userId, 'sessions'));
        const sessionDeletePromises = sessionsSnapshot.docs.map((sessionDoc) =>
          deleteDoc(doc(db, 'users', userId, 'sessions', sessionDoc.id))
        );
        await Promise.all(sessionDeletePromises);
        console.log('Firebase sessions deleted successfully');
      } catch (error) {
        console.error('Error deleting Firebase sessions:', error);
        return { success: false, error: 'Failed to delete sessions from cloud' };
      }

      // Delete all calibration data from Firebase
      try {
        const calibrationSnapshot = await getDocs(collection(db, 'users', userId, 'calibration'));
        const calibrationDeletePromises = calibrationSnapshot.docs.map((calibrationDoc) =>
          deleteDoc(doc(db, 'users', userId, 'calibration', calibrationDoc.id))
        );
        await Promise.all(calibrationDeletePromises);
        console.log('Firebase calibration data deleted successfully');
      } catch (error) {
        console.error('Error deleting Firebase calibration data:', error);
        return { success: false, error: 'Failed to delete calibration data from cloud' };
      }

      // Delete all mood entries from Firebase
      try {
        const moodsSnapshot = await getDocs(collection(db, 'users', userId, 'moods'));
        const moodDeletePromises = moodsSnapshot.docs.map((moodDoc) =>
          deleteDoc(doc(db, 'users', userId, 'moods', moodDoc.id))
        );
        await Promise.all(moodDeletePromises);
        console.log('Firebase moods deleted successfully');
      } catch (error) {
        console.error('Error deleting Firebase moods:', error);
      }
    }

    // Clear local storage data
    try {
      if (user) await clearTaskStorageForUser(user.uid);
      console.log('Local tasks cleared');

      // Clear sessions (need to get all keys with the prefix)
      const allKeys = await AsyncStorage.getAllKeys();
      const sessionKeys = allKeys.filter((key) => key.startsWith(SESSIONS_STORAGE_KEY_PREFIX));
      if (sessionKeys.length > 0) {
        await AsyncStorage.multiRemove(sessionKeys);
        console.log('Local sessions cleared');
      }

      // Clear mood entries (both legacy and user-scoped keys)
      const moodKeys = allKeys.filter((key) => key.startsWith('@neurosync_mood_entries_') || key === MOOD_ENTRIES_KEY);
      if (moodKeys.length > 0) {
        await AsyncStorage.multiRemove(moodKeys);
      } else {
        await AsyncStorage.removeItem(MOOD_ENTRIES_KEY);
      }
      console.log('Local mood entries cleared');
    } catch (error) {
      console.error('Error clearing local storage:', error);
      return { success: false, error: 'Failed to clear local data' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting all data:', error);
    return { success: false, error: 'An unexpected error occurred while resetting data' };
  }
}

/**
 * Reset only tasks data
 */
export async function resetTasks(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    // Clear Firebase tasks if user is logged in
    if (user) {
      try {
        const tasksSnapshot = await getDocs(collection(db, 'users', user.uid, 'tasks'));
        const taskDeletePromises = tasksSnapshot.docs.map((taskDoc) =>
          deleteDoc(doc(db, 'users', user.uid, 'tasks', taskDoc.id))
        );
        await Promise.all(taskDeletePromises);
        console.log('Firebase tasks deleted successfully');
      } catch (error) {
        console.error('Error deleting Firebase tasks:', error);
        return { success: false, error: 'Failed to delete tasks from cloud' };
      }
    }

    if (user) await clearTaskStorageForUser(user.uid);
    console.log('Local tasks cleared');

    return { success: true };
  } catch (error) {
    console.error('Error resetting tasks:', error);
    return { success: false, error: 'Failed to reset tasks' };
  }
}

/**
 * Reset only sessions data
 */
export async function resetSessions(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    // Clear Firebase sessions if user is logged in
    if (user) {
      try {
        const sessionsSnapshot = await getDocs(collection(db, 'users', user.uid, 'sessions'));
        const sessionDeletePromises = sessionsSnapshot.docs.map((sessionDoc) =>
          deleteDoc(doc(db, 'users', user.uid, 'sessions', sessionDoc.id))
        );
        await Promise.all(sessionDeletePromises);
        console.log('Firebase sessions deleted successfully');
      } catch (error) {
        console.error('Error deleting Firebase sessions:', error);
        return { success: false, error: 'Failed to delete sessions from cloud' };
      }
    }

    // Clear local sessions
    const allKeys = await AsyncStorage.getAllKeys();
    const sessionKeys = allKeys.filter((key) => key.startsWith(SESSIONS_STORAGE_KEY_PREFIX));
    if (sessionKeys.length > 0) {
      await AsyncStorage.multiRemove(sessionKeys);
      console.log('Local sessions cleared');
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting sessions:', error);
    return { success: false, error: 'Failed to reset sessions' };
  }
}

/**
 * Reset only mood entries data
 */
export async function resetMoodEntries(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const moodsSnapshot = await getDocs(
        collection(db, 'users', user.uid, 'moods')
      );
      await Promise.all(
        moodsSnapshot.docs.map((moodDoc) =>
          deleteDoc(doc(db, 'users', user.uid, 'moods', moodDoc.id))
        )
      );
    }

    const allKeys = await AsyncStorage.getAllKeys();
    const moodKeys = allKeys.filter(
      (key) =>
        key.startsWith('@neurosync_mood_entries_') ||
        key === MOOD_ENTRIES_KEY
    );
    if (moodKeys.length > 0) {
      await AsyncStorage.multiRemove(moodKeys);
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting mood entries:', error);
    return { success: false, error: 'Failed to reset mood entries' };
  }
}

/**
 * Reset only calibration data
 */
export async function resetCalibration(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      const calibrationSnapshot = await getDocs(collection(db, 'users', user.uid, 'calibration'));
      const calibrationDeletePromises = calibrationSnapshot.docs.map((calibrationDoc) =>
        deleteDoc(doc(db, 'users', user.uid, 'calibration', calibrationDoc.id))
      );
      await Promise.all(calibrationDeletePromises);
      console.log('Firebase calibration data deleted successfully');
    } catch (error) {
      console.error('Error deleting Firebase calibration data:', error);
      return { success: false, error: 'Failed to reset calibration data' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting calibration:', error);
    return { success: false, error: 'Failed to reset calibration data' };
  }
}
