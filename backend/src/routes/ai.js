import express from 'express';
import {
  breakTaskIntoSteps,
  rescheduleTask,
  suggestSplit,
  getDailyPlan,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(authenticate);

router.post('/breakdown',    breakTaskIntoSteps);
router.post('/reschedule',   rescheduleTask);
router.post('/suggest-split', suggestSplit);
router.post('/daily-plan',   getDailyPlan);

export default router;