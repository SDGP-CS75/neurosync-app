import express from 'express';
import {
  breakTaskIntoSteps,
  rescheduleTask,
  suggestSplit,
  getDailyPlan,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateBreakdownBody,
  validateDailyPlanBody,
  validateRescheduleBody,
  validateSplitBody,
} from '../services/validation.js';

const router = express.Router();

function validateBody(validator) {
  return (req, res, next) => {
    const result = validator(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    req.validatedBody = result.value;
    next();
  };
}

// Apply authentication middleware to all AI routes
router.use(authenticate);

router.post('/breakdown', validateBody(validateBreakdownBody), breakTaskIntoSteps);
router.post('/reschedule', validateBody(validateRescheduleBody), rescheduleTask);
router.post('/suggest-split', validateBody(validateSplitBody), suggestSplit);
router.post('/daily-plan', validateBody(validateDailyPlanBody), getDailyPlan);

export default router;
