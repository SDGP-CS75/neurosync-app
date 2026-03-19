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

const defaultProfile: UserProfile = {
  name: 'Sujaya Nimneth',
  email: 'sujaya@example.com',
  age: '22',
  about: 'Computer Science undergraduate at University of Westminster.',
  profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
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
