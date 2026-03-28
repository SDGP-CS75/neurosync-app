import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

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
  setProfileImage: (uri: string) => void;
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

  // Load user profile from Firestore when auth state changes
  // Also track userId for saving theme preferences
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Update userId state
      setUserId(user?.uid ?? null);
      if (user) {
        try {
          // Check if the token is valid by forcing a refresh
          // This helps catch auth errors early before they cause issues
          await user.getIdTokenResult(true);
          
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const themeName = userData.themeName || undefined;
            const hapticFeedback = userData.hapticFeedback !== undefined ? userData.hapticFeedback : true;
            setProfile({
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
              email: userData.email || user.email || '',
              profileImage: userData.photoURL || '',
              about: userData.about || '',
              age: userData.age || '',
              themeName: themeName,
              hapticFeedback: hapticFeedback,
            });
            // Set theme preference for ThemeContext
            setThemePreference(themeName || null);
            // Set haptic feedback preference
            setHapticFeedbackEnabled(hapticFeedback);
          } else {
            // If no profile exists in Firestore, at least use auth data
            setProfile({
              name: user.displayName || '',
              email: user.email || '',
              profileImage: user.photoURL || '',
              about: '',
              age: '',
              themeName: undefined,
            });
            setThemePreference(null);
          }
        } catch (error: any) {
          console.error('Error loading user profile or auth token:', error);
          
          // If token refresh fails (400 error from securetoken.googleapis.com),
          // sign out the user to clear the invalid refresh token
          if (error?.code === 'auth/invalid-refresh-token' || 
              error?.message?.includes('INVALID_REFRESH_TOKEN') ||
              error?.message?.includes('securetoken')) {
            console.log('Invalid refresh token detected, signing out...');
            await signOut(auth);
            setProfile(defaultProfile);
          } else {
            // Fallback to auth data for other errors
            setProfile({
              name: user.displayName || '',
              email: user.email || '',
              profileImage: user.photoURL || '',
              about: '',
              age: '',
            });
          }
        }
      } else {
        // User is logged out
        setProfile(defaultProfile);
        setThemePreference(null);
        setHapticFeedbackEnabled(true);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const setProfileImage = (uri: string) => {
    setProfile((prev) => ({ ...prev, profileImage: uri }));
  };

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
    <UserContext.Provider value={{ profile, updateProfile, setProfileImage, resetProfile, isLoading, saveThemePreference, themePreference, saveHapticFeedbackPreference, hapticFeedbackEnabled }}>
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
