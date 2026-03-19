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
    // Get UID from authenticated user, not from request body
    const uid = req.user.uid;
    const { firstName, lastName, email } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields: firstName and lastName are required' });
    }
    
    // Validate input length
    if (firstName.length > 100 || lastName.length > 100) {
      return res.status(400).json({ error: 'Name fields must be 100 characters or less' });
    }
    
    // Sanitize inputs to prevent injection
    const sanitizedFirstName = firstName.trim().replace(/[<>"'&]/g, '');
    const sanitizedLastName = lastName.trim().replace(/[<>"'&]/g, '');
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      return res.status(409).json({ error: 'User profile already exists' });
    }
    
    // Try to get email from token claims, or use provided email
    const userEmail = req.user.email || email || '';
    
    await admin.firestore().collection('users').doc(uid).set({
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      email: userEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.status(201).json({ message: 'User profile created successfully' });
  } catch (err) {
    console.error('Error creating user profile:', err);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
};
