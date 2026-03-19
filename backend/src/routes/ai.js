import express from 'express';
import { breakTaskIntoSteps } from '../controllers/aiController.js';

const router = express.Router();

router.post('/breakdown', breakTaskIntoSteps);

export default router;
