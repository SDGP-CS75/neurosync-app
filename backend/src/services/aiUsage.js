import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getDateKeyInTimeZone } from './dateContext.js';

const DEFAULT_LIMITS = {
  requests: 20,
  tokens: 200_000,
  costUsd: 1,
};

const DEFAULT_PRICING = {
  inputPerMillionUsd: 0.05,
  outputPerMillionUsd: 0.08,
};

function readNonNegativeNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readNonNegativeInteger(value, fallback) {
  const parsed = readNonNegativeNumber(value, fallback);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export function getAiUsageConfig(env = process.env) {
  return {
    enabled: env.AI_QUOTA_ENABLED !== 'false',
    limits: {
      requests: readNonNegativeInteger(
        env.AI_DAILY_REQUEST_LIMIT,
        DEFAULT_LIMITS.requests
      ),
      tokens: readNonNegativeInteger(
        env.AI_DAILY_TOKEN_LIMIT,
        DEFAULT_LIMITS.tokens
      ),
      costUsd: readNonNegativeNumber(
        env.AI_DAILY_COST_LIMIT_USD,
        DEFAULT_LIMITS.costUsd
      ),
    },
    pricing: {
      inputPerMillionUsd: readNonNegativeNumber(
        env.GROQ_INPUT_COST_PER_1M_USD,
        DEFAULT_PRICING.inputPerMillionUsd
      ),
      outputPerMillionUsd: readNonNegativeNumber(
        env.GROQ_OUTPUT_COST_PER_1M_USD,
        DEFAULT_PRICING.outputPerMillionUsd
      ),
    },
  };
}

export class AiQuotaError extends Error {
  constructor(metric, limit, used, retryAfter) {
    super(`Daily AI ${metric} limit reached. Try again after the quota resets.`);
    this.name = 'AiQuotaError';
    this.status = 429;
    this.isQuota = true;
    this.metric = metric;
    this.limit = limit;
    this.used = used;
    this.retryAfter = retryAfter;
  }
}

export class AiUsageUnavailableError extends Error {
  constructor() {
    super('AI usage tracking is temporarily unavailable. Please try again.');
    this.name = 'AiUsageUnavailableError';
    this.status = 503;
  }
}

export function normalizeUsage(data = {}) {
  return {
    requests: readNonNegativeInteger(data.requests, 0),
    promptTokens: readNonNegativeInteger(data.promptTokens, 0),
    completionTokens: readNonNegativeInteger(data.completionTokens, 0),
    totalTokens: readNonNegativeInteger(data.totalTokens, 0),
    costUsd: readNonNegativeNumber(data.costUsd, 0),
  };
}

export function evaluateQuota(usage, limits) {
  const current = normalizeUsage(usage);
  const checks = [
    ['requests', current.requests, limits.requests],
    ['tokens', current.totalTokens, limits.tokens],
    ['cost', current.costUsd, limits.costUsd],
  ];

  for (const [metric, used, limit] of checks) {
    if (used >= limit) {
      return { allowed: false, metric, used, limit };
    }
  }

  return { allowed: true };
}

export function extractGroqUsage(data, pricing = DEFAULT_PRICING) {
  const raw = data?.usage || {};
  const promptTokens = readNonNegativeInteger(raw.prompt_tokens, 0);
  const completionTokens = readNonNegativeInteger(raw.completion_tokens, 0);
  const totalTokens = readNonNegativeInteger(
    raw.total_tokens,
    promptTokens + completionTokens
  );
  const costUsd =
    (promptTokens * pricing.inputPerMillionUsd +
      completionTokens * pricing.outputPerMillionUsd) /
    1_000_000;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd: Math.round(costUsd * 1e12) / 1e12,
  };
}

export function getSecondsUntilUtcMidnight(now = new Date()) {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(1, Math.ceil((nextMidnight - now.getTime()) / 1000));
}

export async function reserveAiRequest({
  uid,
  now = new Date(),
  config = getAiUsageConfig(),
  db = getFirestore(),
}) {
  if (!uid) throw new Error('Authenticated user is required for AI quota');

  const dateKey = getDateKeyInTimeZone(now, 'UTC');
  const ref = db
    .collection('aiUsage')
    .doc(uid)
    .collection('daily')
    .doc(dateKey);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const usage = normalizeUsage(snapshot.exists ? snapshot.data() : {});
    const decision = evaluateQuota(usage, config.limits);

    if (!decision.allowed) {
      throw new AiQuotaError(
        decision.metric,
        decision.limit,
        decision.used,
        getSecondsUntilUtcMidnight(now)
      );
    }

    transaction.set(
      ref,
      {
        dateKey,
        requests: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
        ...(!snapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true }
    );
  });

  return { dateKey, config };
}

export async function recordAiUsage({
  uid,
  dateKey,
  usage,
  db = getFirestore(),
}) {
  if (!uid || !dateKey) return;

  const normalized = normalizeUsage(usage);
  if (normalized.totalTokens === 0 && normalized.costUsd === 0) return;

  const ref = db
    .collection('aiUsage')
    .doc(uid)
    .collection('daily')
    .doc(dateKey);

  await ref.set(
    {
      promptTokens: FieldValue.increment(normalized.promptTokens),
      completionTokens: FieldValue.increment(normalized.completionTokens),
      totalTokens: FieldValue.increment(normalized.totalTokens),
      costUsd: FieldValue.increment(normalized.costUsd),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function recordGroqUsage(req, data) {
  const context = req.aiUsage;
  if (!context) return;

  try {
    await recordAiUsage({
      uid: req.user?.uid,
      dateKey: context.dateKey,
      usage: extractGroqUsage(data, context.config.pricing),
    });
  } catch (error) {
    console.error('[aiUsage] Failed to record provider usage', {
      name: error?.name,
      code: error?.code,
    });
  }
}

export function createAiQuotaMiddleware({
  getConfig = getAiUsageConfig,
  reserve = reserveAiRequest,
} = {}) {
  return async (req, res, next) => {
    const config = getConfig();
    if (!config.enabled) return next();

    try {
      req.aiUsage = await reserve({
        uid: req.user?.uid,
        config,
      });
      return next();
    } catch (error) {
      if (error instanceof AiQuotaError || error?.isQuota) {
        return next(error);
      }
      console.error('[aiUsage] Failed to reserve AI request', {
        name: error?.name,
        code: error?.code,
      });
      return next(new AiUsageUnavailableError());
    }
  };
}
