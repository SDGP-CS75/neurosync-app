import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AiQuotaError,
  createAiQuotaMiddleware,
  evaluateQuota,
  extractGroqUsage,
  getAiUsageConfig,
  getSecondsUntilUtcMidnight,
  reserveAiRequest,
} from '../src/services/aiUsage.js';

function createConfig(overrides = {}) {
  return {
    enabled: true,
    limits: {
      requests: 20,
      tokens: 200_000,
      costUsd: 1,
      ...overrides.limits,
    },
    pricing: {
      inputPerMillionUsd: 0.05,
      outputPerMillionUsd: 0.08,
      ...overrides.pricing,
    },
  };
}

function fakeDb(existingData = null) {
  const writes = [];
  const ref = { path: 'aiUsage/user-1/daily/2026-10-28' };
  const db = {
    collection() {
      return {
        doc() {
          return {
            collection() {
              return {
                doc() {
                  return ref;
                },
              };
            },
          };
        },
      };
    },
    async runTransaction(callback) {
      return callback({
        async get(target) {
          assert.equal(target, ref);
          return {
            exists: existingData !== null,
            data: () => existingData || {},
          };
        },
        set(target, data, options) {
          writes.push({ target, data, options });
        },
      });
    },
  };
  return { db, writes };
}

test('AI usage config has safe defaults and environment overrides', () => {
  assert.deepEqual(getAiUsageConfig({}), {
    enabled: true,
    limits: { requests: 20, tokens: 200_000, costUsd: 1 },
    pricing: { inputPerMillionUsd: 0.05, outputPerMillionUsd: 0.08 },
  });

  const config = getAiUsageConfig({
    AI_QUOTA_ENABLED: 'false',
    AI_DAILY_REQUEST_LIMIT: '40',
    AI_DAILY_TOKEN_LIMIT: '500000',
    AI_DAILY_COST_LIMIT_USD: '2.50',
    GROQ_INPUT_COST_PER_1M_USD: '0.10',
    GROQ_OUTPUT_COST_PER_1M_USD: '0.20',
  });
  assert.deepEqual(config, {
    enabled: false,
    limits: { requests: 40, tokens: 500_000, costUsd: 2.5 },
    pricing: { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.2 },
  });
});

test('quota evaluation blocks each configured daily dimension', () => {
  const limits = { requests: 20, tokens: 1000, costUsd: 0.5 };

  assert.deepEqual(evaluateQuota({}, limits), { allowed: true });
  assert.deepEqual(
    evaluateQuota({ requests: 20 }, limits),
    { allowed: false, metric: 'requests', used: 20, limit: 20 }
  );
  assert.deepEqual(
    evaluateQuota({ totalTokens: 1000 }, limits),
    { allowed: false, metric: 'tokens', used: 1000, limit: 1000 }
  );
  assert.deepEqual(
    evaluateQuota({ costUsd: 0.5 }, limits),
    { allowed: false, metric: 'cost', used: 0.5, limit: 0.5 }
  );
});

test('Groq usage extraction records tokens and computes cost', () => {
  assert.deepEqual(
    extractGroqUsage(
      {
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      },
      { inputPerMillionUsd: 0.05, outputPerMillionUsd: 0.08 }
    ),
    {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      costUsd: 0.00009,
    }
  );
});

test('quota reset is measured from UTC midnight', () => {
  assert.equal(
    getSecondsUntilUtcMidnight(new Date('2026-10-28T23:59:00.000Z')),
    60
  );
});

test('request reservation is atomic and records one request', async () => {
  const { db, writes } = fakeDb();
  const config = createConfig();
  const result = await reserveAiRequest({
    uid: 'user-1',
    now: new Date('2026-10-28T10:00:00.000Z'),
    config,
    db,
  });

  assert.equal(result.dateKey, '2026-10-28');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].options.merge, true);
  assert.equal(writes[0].data.dateKey, '2026-10-28');
  assert.equal(writes[0].data.requests.operand, 1);
  assert.ok(writes[0].data.createdAt);
});

test('request reservation rejects an exhausted daily request quota', async () => {
  const { db } = fakeDb({ requests: 20 });

  await assert.rejects(
    reserveAiRequest({
      uid: 'user-1',
      now: new Date('2026-10-28T10:00:00.000Z'),
      config: createConfig(),
      db,
    }),
    (error) => {
      assert.ok(error instanceof AiQuotaError);
      assert.equal(error.metric, 'requests');
      assert.equal(error.status, 429);
      assert.equal(error.isQuota, true);
      return true;
    }
  );
});

test('quota middleware attaches usage context after reservation', async () => {
  const config = createConfig();
  const middleware = createAiQuotaMiddleware({
    getConfig: () => config,
    reserve: async ({ uid }) => {
      assert.equal(uid, 'user-1');
      return { dateKey: '2026-10-28', config };
    },
  });
  const req = { user: { uid: 'user-1' } };
  let nextError;

  await middleware(req, {}, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(req.aiUsage, { dateKey: '2026-10-28', config });
});

test('quota middleware can be disabled without touching Firestore', async () => {
  let reserveCalled = false;
  const middleware = createAiQuotaMiddleware({
    getConfig: () => ({ ...createConfig(), enabled: false }),
    reserve: async () => {
      reserveCalled = true;
    },
  });
  let nextCalled = false;

  await middleware({ user: { uid: 'user-1' } }, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(reserveCalled, false);
});

test('quota middleware forwards quota errors unchanged', async () => {
  const quotaError = new AiQuotaError('tokens', 1000, 1000, 120);
  const middleware = createAiQuotaMiddleware({
    getConfig: () => createConfig(),
    reserve: async () => {
      throw quotaError;
    },
  });
  let nextError;

  await middleware({ user: { uid: 'user-1' } }, {}, (error) => {
    nextError = error;
  });

  assert.equal(nextError, quotaError);
});

test('quota middleware hides infrastructure errors from clients', async () => {
  const middleware = createAiQuotaMiddleware({
    getConfig: () => createConfig(),
    reserve: async () => {
      throw new Error('Firestore credentials exposed');
    },
  });
  let nextError;

  await middleware({ user: { uid: 'user-1' } }, {}, (error) => {
    nextError = error;
  });

  assert.equal(nextError.name, 'AiUsageUnavailableError');
  assert.equal(nextError.status, 503);
  assert.doesNotMatch(nextError.message, /Firestore|credentials/i);
});
