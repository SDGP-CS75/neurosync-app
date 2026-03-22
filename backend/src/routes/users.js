import express from 'express';
import admin from 'firebase-admin';
import { getUserProfile, createUserProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticate, getUserProfile);
router.post('/', authenticate, createUserProfile);
router.get('/get-test-token', async (req, res) => {
  try {
    // Use a real Firebase user UID from Authentication in Firebase Console
    const uid = 'YOUR_FIREBASE_UID';
    
    // Create custom token then exchange for ID token
    const customToken = await admin.auth().createCustomToken(uid);
    
    // Exchange custom token for ID token via Firebase Auth REST API
    const apiKey = 'AIzaSyBJJl6plWxuuIncE8TPVgrgCu7lHDNfQUQ'; // Firebase Web API Key
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    const data = await response.json();
    
    if (data.idToken) {
      res.json({ idToken: data.idToken, uid: uid });
    } else {
      res.status(400).json({ error: data.error?.message || 'Failed to exchange token' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
