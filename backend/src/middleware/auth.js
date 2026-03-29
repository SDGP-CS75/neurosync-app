import admin from 'firebase-admin';

export const authenticate = async (req, res, next) => {
  // Skip auth when SKIP_AUTH is set (for testing/deployment)
  const skipAuth = process.env.SKIP_AUTH === 'true';
  if (skipAuth) {
    req.user = { uid: 'test-user-123' };
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // uid is available at req.user.uid
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};