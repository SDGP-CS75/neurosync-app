import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const setProfileImage = (uri: string) => {
    setProfile((prev) => ({ ...prev, profileImage: uri }));
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, setProfileImage }}>
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
