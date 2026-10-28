import cors from 'cors';

const DEFAULT_ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'X-Timezone',
];

export function parseAllowedOrigins(value) {
  if (typeof value !== 'string') return new Set();

  return new Set(
    value
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  );
}

export function isOriginAllowed(origin, allowedOrigins, nodeEnv = 'development') {
  if (!origin) return true;
  if (allowedOrigins.has('*')) return true;
  if (allowedOrigins.has(origin.replace(/\/+$/, ''))) return true;

  // Development remains frictionless when no allowlist is configured.
  return nodeEnv !== 'production' && allowedOrigins.size === 0;
}

export function createCorsMiddleware({
  nodeEnv = process.env.NODE_ENV || 'development',
  allowedOriginsValue = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN,
} = {}) {
  const allowedOrigins = parseAllowedOrigins(allowedOriginsValue);
  const corsHandler = cors({
    origin(origin, callback) {
      callback(null, isOriginAllowed(origin, allowedOrigins, nodeEnv));
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: DEFAULT_ALLOWED_HEADERS,
    maxAge: 600,
  });

  return (req, res, next) => {
    const origin = req.get('origin');
    if (!isOriginAllowed(origin, allowedOrigins, nodeEnv)) {
      return res.status(403).json({ error: 'Origin is not allowed' });
    }
    return corsHandler(req, res, next);
  };
}
