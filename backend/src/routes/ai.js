import express from 'express';
import {
  breakTaskIntoSteps,
  rescheduleTask,
  suggestSplit,
  getDailyPlan,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { createValidationMiddleware } from '../middleware/validate.js';
import { createAiQuotaMiddleware } from '../services/aiUsage.js';
import {
  validateBreakdownBody,
  validateDailyPlanBody,
  validateRescheduleBody,
  validateSplitBody,
} from '../services/validation.js';

function requireGroqApiKey(req, res, next) {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured' });
  }
  return next();
}

export function createAiRouter({
  authMiddleware = authenticate,
  quotaMiddleware = createAiQuotaMiddleware(),
} = {}) {
  const router = express.Router();

  router.use(authMiddleware);

  router.post(
    '/breakdown',
    createValidationMiddleware(validateBreakdownBody),
    requireGroqApiKey,
    quotaMiddleware,
    breakTaskIntoSteps
  );
  router.post(
    '/reschedule',
    createValidationMiddleware(validateRescheduleBody),
    requireGroqApiKey,
    quotaMiddleware,
    rescheduleTask
  );
  router.post(
    '/suggest-split',
    createValidationMiddleware(validateSplitBody),
    requireGroqApiKey,
    quotaMiddleware,
    suggestSplit
  );
  router.post(
    '/daily-plan',
    createValidationMiddleware(validateDailyPlanBody),
    requireGroqApiKey,
    quotaMiddleware,
    getDailyPlan
  );

  return router;
}

export default createAiRouter();
