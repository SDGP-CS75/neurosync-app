import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
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
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to auth data
          setProfile({
            name: user.displayName || '',
            email: user.email || '',
            profileImage: user.photoURL || '',
            about: '',
            age: '',
          });
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
