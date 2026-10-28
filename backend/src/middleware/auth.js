import { getAuth } from 'firebase-admin/auth';

export function isAuthBypassEnabled(env = process.env) {
  return env.NODE_ENV !== 'production' && env.SKIP_AUTH === 'true';
}

export function createAuthenticate({
  env = process.env,
  verifyIdToken = (token) => getAuth().verifyIdToken(token),
} = {}) {
  return async (req, res, next) => {
    if (isAuthBypassEnabled(env)) {
      req.user = { uid: 'test-user-123' };
      return next();
    }

    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      req.user = await verifyIdToken(match[1]);
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export const authenticate = createAuthenticate();
