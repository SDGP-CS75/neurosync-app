import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserProfile {
  name: string;
  email: string;
  age: string;
  about: string;
  profileImage: string;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setProfileImage: (uri: string) => void;
  resetProfile: () => void;
  isLoading: boolean;
}

// Default empty profile - should be replaced with actual user data after authentication
const defaultProfile: UserProfile = {
  name: '',
  email: '',
  age: '',
  about: '',
  profileImage: '',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile from Firestore when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
            setProfile({
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
              email: userData.email || user.email || '',
              profileImage: userData.photoURL || '',
              about: userData.about || '',
              age: userData.age || '',
            });
          } else {
            // If no profile exists in Firestore, at least use auth data
            setProfile({
              name: user.displayName || '',
              email: user.email || '',
              profileImage: user.photoURL || '',
              about: '',
              age: '',
            });
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
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, setProfileImage, resetProfile, isLoading }}>
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
