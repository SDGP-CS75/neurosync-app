import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function normalizeName(value) {
  if (typeof value !== 'string') return null;

  const name = value.trim();
  if (
    name.length === 0 ||
    name.length > MAX_NAME_LENGTH ||
    CONTROL_CHARACTERS.test(name)
  ) {
    return null;
  }

  return name;
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;

  const email = value.trim();
  if (email.length === 0) return '';
  if (
    email.length > MAX_EMAIL_LENGTH ||
    CONTROL_CHARACTERS.test(email) ||
    !/^[^\s@]+@[^\s@]+$/.test(email)
  ) {
    return null;
  }

  return email;
}

export function createUserController({
  getDb = getFirestore,
  logger = console,
} = {}) {
  const getUserProfile = async (req, res) => {
    try {
      const userDoc = await getDb()
        .collection('users')
        .doc(req.user.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(userDoc.data());
    } catch (error) {
      logger.error('Error loading user profile:', error);
      return res.status(500).json({ error: 'Failed to load user profile' });
    }
  };

  const createUserProfile = async (req, res) => {
    try {
      const uid = req.user.uid;
      const body =
        req.body && typeof req.body === 'object' ? req.body : {};
      const firstName = normalizeName(body.firstName);
      const lastName = normalizeName(body.lastName);

      if (!firstName || !lastName) {
        return res.status(400).json({
          error:
            'firstName and lastName must be non-empty strings of 100 characters or fewer',
        });
      }

      let userEmail = '';
      if (typeof req.user.email === 'string' && req.user.email.trim()) {
        userEmail = normalizeEmail(req.user.email);
      } else if (body.email !== undefined && body.email !== null) {
        userEmail = normalizeEmail(body.email);
      }

      if (userEmail === null) {
        return res.status(400).json({ error: 'email must be a valid address' });
      }

      const db = getDb();
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        return res.status(409).json({ error: 'User profile already exists' });
      }

      await db.collection('users').doc(uid).set({
        firstName,
        lastName,
        email: userEmail,
        createdAt: FieldValue.serverTimestamp(),
      });

      return res
        .status(201)
        .json({ message: 'User profile created successfully' });
    } catch (error) {
      logger.error('Error creating user profile:', error);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }
  };

  return { getUserProfile, createUserProfile };
}

const defaultController = createUserController();

export const getUserProfile = defaultController.getUserProfile;
export const createUserProfile = defaultController.createUserProfile;
