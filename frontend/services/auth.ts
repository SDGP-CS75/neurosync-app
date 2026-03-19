import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { API_BASE } from '../constants/api';

const auth = getAuth();

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUpUser = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const createUserProfile = async (uid: string, firstName: string, lastName: string) => {
  const token = await getAuth().currentUser?.getIdToken();
  const url = `${API_BASE}/api/users`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, firstName, lastName }),
  });
  const data = await response.json();
  return data;
};