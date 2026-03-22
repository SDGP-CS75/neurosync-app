import express from 'express';
import {
  breakTaskIntoSteps,
  rescheduleTask,
  suggestSplit,
  getDailyPlan,
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/breakdown',    breakTaskIntoSteps);
router.post('/reschedule',   rescheduleTask);
router.post('/suggest-split', suggestSplit);
router.post('/daily-plan',   getDailyPlan);

export default router;