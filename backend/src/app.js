import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import { createAiRouter } from './routes/ai.js';
import { createUserRouter } from './routes/users.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

export function resolveTrustProxyHops(value, nodeEnv = 'development') {
  if (value === undefined || value === null || value === '') {
    return nodeEnv === 'production' ? 1 : 0;
  }

  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0) {
    return nodeEnv === 'production' ? 1 : 0;
  }
  return hops;
}

export function createApp({
  nodeEnv = process.env.NODE_ENV || 'development',
  corsOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN,
  trustProxyHops = resolveTrustProxyHops(process.env.TRUST_PROXY_HOPS, nodeEnv),
  authMiddleware = authenticate,
  aiQuotaMiddleware,
  rateLimitEnabled = true,
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxyHops);

  app.use(compression());
  app.use(createCorsMiddleware({ nodeEnv, allowedOriginsValue: corsOrigins }));

  if (rateLimitEnabled) {
    app.use('/api/', rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    }));
  }

  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api/users', createUserRouter({ authMiddleware }));
  app.use('/api/ai', createAiRouter({ authMiddleware, quotaMiddleware: aiQuotaMiddleware }));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/', (req, res) => {
    res.send('Server is running!');
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);
  return app;
}

export default createApp;
