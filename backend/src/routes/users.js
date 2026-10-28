import express from 'express';
import { getUserProfile, createUserProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

export function createUserRouter({ authMiddleware = authenticate } = {}) {
  const router = express.Router();

  router.get('/profile', authMiddleware, getUserProfile);
  router.post('/', authMiddleware, createUserProfile);

  return router;
}

export default createUserRouter();
