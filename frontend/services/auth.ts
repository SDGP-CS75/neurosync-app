import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { API_BASE } from '../constants/api';

const auth = getAuth();

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Login failed: ' + error.message);
    } else {
      throw new Error('Login failed: Unknown error');
    }
  }
};

export const signUpUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Signup failed: ' + error.message);
    } else {
      throw new Error('Signup failed: Unknown error');
    }
  }
};

export const createUserProfile = async (uid: string, firstName: string, lastName: string) => {
  try {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const url = `${API_BASE}/api/users`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid, firstName, lastName }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create user profile: ${errorData.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Profile creation failed: ' + error.message);
    } else {
      throw new Error('Profile creation failed: Unknown error');
    }
  }
};