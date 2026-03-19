import admin from 'firebase-admin';

export const getUserProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(userDoc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUserProfile = async (req, res) => {
  try {
    const { uid, firstName, lastName } = req.body;
    if (!uid || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      return res.status(409).json({ error: 'User profile already exists' });
    }
    
    await admin.firestore().collection('users').doc(uid).set({
      firstName,
      lastName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.status(201).json({ message: 'User profile created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
