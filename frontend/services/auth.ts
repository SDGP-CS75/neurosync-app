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

export const createUserProfile = async (firstName: string, lastName: string) => {
  const token = await getAuth().currentUser?.getIdToken();
  const url = `${API_BASE}/api/users`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // UID is now extracted from the authenticated user's token on the backend
    body: JSON.stringify({ firstName, lastName }),
  });
  const data = await response.json();
  return data;
};