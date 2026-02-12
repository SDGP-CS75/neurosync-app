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
