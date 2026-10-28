import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

interface SignUpProfile {
  firstName: string;
  lastName: string;
}

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

export const signUpUser = async (
  email: string,
  password: string,
  profile?: SignUpProfile
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (profile) {
      const displayName = `${profile.firstName} ${profile.lastName}`.trim();
      if (displayName) {
        try {
          await updateProfile(userCredential.user, { displayName });
        } catch {
          // The Firestore profile is still created with the explicit names.
        }
      }
    }

    return userCredential.user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Signup failed: ' + error.message);
    } else {
      throw new Error('Signup failed: Unknown error');
    }
  }
};
