import express from 'express';
import {
  breakTaskIntoSteps,
  rescheduleTask,
  suggestSplit,
  getDailyPlan,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { createValidationMiddleware } from '../middleware/validate.js';
import {
  validateBreakdownBody,
  validateDailyPlanBody,
  validateRescheduleBody,
  validateSplitBody,
} from '../services/validation.js';

export function createAiRouter({ authMiddleware = authenticate } = {}) {
  const router = express.Router();

  router.use(authMiddleware);

  router.post(
    '/breakdown',
    createValidationMiddleware(validateBreakdownBody),
    breakTaskIntoSteps
  );
  router.post(
    '/reschedule',
    createValidationMiddleware(validateRescheduleBody),
    rescheduleTask
  );
  router.post(
    '/suggest-split',
    createValidationMiddleware(validateSplitBody),
    suggestSplit
  );
  router.post(
    '/daily-plan',
    createValidationMiddleware(validateDailyPlanBody),
    getDailyPlan
  );

  return router;
}

export default createAiRouter();
