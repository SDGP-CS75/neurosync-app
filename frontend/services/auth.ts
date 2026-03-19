import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const auth = getAuth();

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Logout failed: ' + error.message);
    } else {
      throw new Error('Logout failed: Unknown error');
    }
  }
};

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