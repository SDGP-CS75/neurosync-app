import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp, resolveTrustProxyHops } from '../src/app.js';
import {
  createAuthenticate,
  isAuthBypassEnabled,
} from '../src/middleware/auth.js';
import {
  createCorsMiddleware,
  isOriginAllowed,
  parseAllowedOrigins,
} from '../src/middleware/cors.js';
import { createValidationMiddleware } from '../src/middleware/validate.js';
import { validateBreakdownBody } from '../src/services/validation.js';

function mockRequest({
  method = 'GET',
  origin,
  authorization,
  body,
} = {}) {
  const headers = {};
  if (origin) headers.origin = origin;
  if (authorization) headers.authorization = authorization;

  return {
    method,
    body,
    headers,
    get(name) {
      return headers[String(name).toLowerCase()];
    },
  };
}

function mockResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    removeHeader(name) {
      headers.delete(String(name).toLowerCase());
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

test('auth bypass is available only outside production', () => {
  assert.equal(
    isAuthBypassEnabled({ NODE_ENV: 'development', SKIP_AUTH: 'true' }),
    true
  );
  assert.equal(
    isAuthBypassEnabled({ NODE_ENV: 'test', SKIP_AUTH: 'true' }),
    true
  );
  assert.equal(
    isAuthBypassEnabled({ NODE_ENV: 'production', SKIP_AUTH: 'true' }),
    false
  );
});

test('production ignores SKIP_AUTH and rejects unauthenticated API calls', async () => {
  const middleware = createAuthenticate({
    env: { NODE_ENV: 'production', SKIP_AUTH: 'true' },
    verifyIdToken: async () => ({ uid: 'verified-user' }),
  });
  const req = mockRequest();
  const res = mockResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Authentication required' });
});

test('valid bearer tokens populate the authenticated user', async () => {
  const middleware = createAuthenticate({
    env: { NODE_ENV: 'production' },
    verifyIdToken: async (token) => ({ uid: `user-${token}` }),
  });
  const req = mockRequest({ authorization: 'Bearer token-123' });
  const res = mockResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.uid, 'user-token-123');
});

test('invalid AI payloads are rejected by middleware before controllers run', () => {
  const middleware = createValidationMiddleware(validateBreakdownBody);
  const req = mockRequest({ body: { task: 'ab' } });
  const res = mockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: 'Task must contain at least 3 characters',
  });
});

test('valid AI payloads are attached for the controller', () => {
  const middleware = createValidationMiddleware(validateBreakdownBody);
  const req = mockRequest({ body: { task: ' Plan launch ' } });
  const res = mockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.validatedBody, { task: 'Plan launch' });
});

test('origin allowlists normalize whitespace and trailing slashes', () => {
  const origins = parseAllowedOrigins(
    ' https://app.example.com/ , https://admin.example.com '
  );
  assert.deepEqual(
    origins,
    new Set(['https://app.example.com', 'https://admin.example.com'])
  );
});

test('production CORS rejects unconfigured browser origins', () => {
  const middleware = createCorsMiddleware({
    nodeEnv: 'production',
    allowedOriginsValue: 'https://app.example.com',
  });
  const req = mockRequest({ origin: 'https://evil.example.com' });
  const res = mockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Origin is not allowed' });
});

test('production CORS allows configured origins', () => {
  const middleware = createCorsMiddleware({
    nodeEnv: 'production',
    allowedOriginsValue: 'https://app.example.com/',
  });
  const req = mockRequest({ origin: 'https://app.example.com' });
  const res = mockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(
    res.getHeader('access-control-allow-origin'),
    'https://app.example.com'
  );
});

test('development CORS allows unconfigured origins for local tools', () => {
  assert.equal(
    isOriginAllowed('http://localhost:8081', new Set(), 'development'),
    true
  );
  assert.equal(
    isOriginAllowed('http://localhost:8081', new Set(), 'production'),
    false
  );
});

test('trust proxy hops are numeric and default safely by environment', () => {
  assert.equal(resolveTrustProxyHops(undefined, 'production'), 1);
  assert.equal(resolveTrustProxyHops(undefined, 'development'), 0);
  assert.equal(resolveTrustProxyHops('2', 'production'), 2);
  assert.equal(resolveTrustProxyHops('invalid', 'production'), 1);
  assert.equal(resolveTrustProxyHops('-1', 'development'), 0);
});

test('createApp wires configuration without starting a listener', () => {
  const app = createApp({
    nodeEnv: 'production',
    corsOrigins: 'https://app.example.com',
    trustProxyHops: 2,
    rateLimitEnabled: false,
  });

  assert.equal(app.get('trust proxy'), 2);
  assert.equal(app.get('x-powered-by'), false);
});
