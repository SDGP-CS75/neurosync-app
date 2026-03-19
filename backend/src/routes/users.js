import express from 'express';
import { getUserProfile, createUserProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticate, getUserProfile);
router.post('/', createUserProfile);

export default router;
