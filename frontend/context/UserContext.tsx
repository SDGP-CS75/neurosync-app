import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  ensureUserProfile,
  fallbackProfileFromUser,
  UserProfileData,
} from '../services/userProfile';
import { ProfileImageInput, uploadProfileImage } from '../services/profileImage';

interface UserProfile {
  name: string;
  email: string;
  age: string;
  about: string;
  profileImage: string;
  themeName?: string;
  hapticFeedback?: boolean;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setProfileImage: (image: ProfileImageInput) => Promise<void>;
  resetProfile: () => void;
  isLoading: boolean;
  saveThemePreference: (themeName: string) => Promise<void>;
  themePreference: UserThemePreference;
  saveHapticFeedbackPreference: (enabled: boolean) => Promise<void>;
  hapticFeedbackEnabled: boolean;
}

// Default empty profile - should be replaced with actual user data after authentication
const defaultProfile: UserProfile = {
  name: '',
  email: '',
  age: '',
  about: '',
  profileImage: '',
  themeName: undefined,
  hapticFeedback: true,
};

// Type for theme preference that can be passed to ThemeContext
export type UserThemePreference = string | null;

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [themePreference, setThemePreference] = useState<UserThemePreference>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState<boolean>(true);

  const applyProfile = useCallback((data: UserProfileData) => {
    const themeName = data.themeName;
    const hapticFeedback = data.hapticFeedback ?? true;
    setProfile({
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      profileImage: data.photoURL,
      about: data.about,
      age: data.age,
      themeName,
      hapticFeedback,
    });
    setThemePreference(themeName ?? null);
    setHapticFeedbackEnabled(hapticFeedback);
  }, []);

  const loadUserProfile = useCallback(async (user: User) => {
    setUserId(user.uid);
    try {
      applyProfile(await ensureUserProfile(user));
    } catch (error) {
      console.warn('Profile sync failed; using authentication data', {
        name: error instanceof Error ? error.name : typeof error,
      });
      applyProfile(fallbackProfileFromUser(user));
    }
  }, [applyProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        void loadUserProfile(user);
      } else {
        setUserId(null);
        setProfile(defaultProfile);
        setThemePreference(null);
        setHapticFeedbackEnabled(true);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  useEffect(() => {
    const refreshProfile = () => {
      const user = auth.currentUser;
      if (user) void loadUserProfile(user);
    };
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshProfile();
    });
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      if (state.isConnected) refreshProfile();
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeNetwork();
    };
  }, [loadUserProfile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));

    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const firestoreData: Record<string, unknown> = {};

      if (updates.name !== undefined) {
        const parts = updates.name.trim().split(/\s+/);
        firestoreData.firstName = parts[0] || '';
        firestoreData.lastName = parts.slice(1).join(' ') || '';
      }
      if (updates.email !== undefined) firestoreData.email = updates.email.trim();
      if (updates.age !== undefined) firestoreData.age = updates.age.trim();
      if (updates.about !== undefined) firestoreData.about = updates.about.trim();
      if (updates.profileImage !== undefined) firestoreData.photoURL = updates.profileImage;

      await setDoc(userDocRef, firestoreData, { merge: true });
    } catch (error) {
      console.error('Error saving user profile to Firestore:', error);
      throw error;
    }
  }, [userId]);

  const setProfileImage = useCallback(async (image: ProfileImageInput) => {
    if (!userId) throw new Error('You must be signed in to update your profile image.');

    const photoURL = await uploadProfileImage(userId, image);
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { photoURL }, { merge: true });
    setProfile((prev) => ({ ...prev, profileImage: photoURL }));
  }, [userId]);

  const resetProfile = () => {
    setProfile(defaultProfile);
    setThemePreference(null);
    setHapticFeedbackEnabled(true);
  };

  // Save theme preference to Firestore
  const saveThemePreference = useCallback(async (themeName: string) => {
    if (!userId) return;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { themeName }, { merge: true });
      setThemePreference(themeName);
      setProfile(prev => ({ ...prev, themeName }));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [userId]);

  // Save haptic feedback preference to Firestore
  const saveHapticFeedbackPreference = useCallback(async (enabled: boolean) => {
    if (!userId) return;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { hapticFeedback: enabled }, { merge: true });
      setHapticFeedbackEnabled(enabled);
      setProfile(prev => ({ ...prev, hapticFeedback: enabled }));
    } catch (error) {
      console.error('Error saving haptic feedback preference:', error);
    }
  }, [userId]);

  return (
    <UserContext.Provider value={{ profile, updateProfile, updateUserProfile, setProfileImage, resetProfile, isLoading, saveThemePreference, themePreference, saveHapticFeedbackPreference, hapticFeedbackEnabled }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
