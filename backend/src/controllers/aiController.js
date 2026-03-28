import { getCalibrationContext } from '../services/aiCalibration.js';

const GROQ_URL         = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TASK_LENGTH  = 500;
const MIN_TASK_LENGTH  = 3;
const MAX_STEP_MINUTES = 90;
const REQUEST_TIMEOUT  = 12_000;
const MAX_RETRIES      = 2;
const RETRY_DELAY_MS   = 800;

const ALLOWED_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
];

const CATEGORY_META = {
  Work:     { emoji: '💼', iconBg: '#E3F2FD' },
  Personal: { emoji: '🙂', iconBg: '#F3E5F5' },
  Shopping: { emoji: '🛒', iconBg: '#E8F5E9' },
  Health:   { emoji: '💪', iconBg: '#FCE4EC' },
  Finance:  { emoji: '💰', iconBg: '#FFFDE7' },
  Creative: { emoji: '🎨', iconBg: '#FFF3E0' },
  Other:    { emoji: '📋', iconBg: '#E8E4FF' },
};

const VAGUE_SINGLE_WORDS = new Set([
  'lol','lmao','lmfao','rofl','haha','hehe','hmmm','hmm','ugh',
  'yay','wow','meh','bruh','omg','omfg','idk','nvm','smh','wtf',
  'hi','hey','hello','bye','goodbye','sup','yo','ok','okay','yep','yeah',
  'asdf','qwerty',
]);

const OFFENSIVE_WORDS = new Set([
  'fuck','shit','bitch','fuk','fck','stfu','gtfo',
  'motherfucker','fucker','bullshit','jackass','dumbass','retard','slut',
  'whore','nigger','nigga','faggot','prick','wanker','twat',
]);

const REFUSAL_PHRASES = [
  "i can't", "i cannot", "i'm not able", "i am not able",
  "i won't", "i will not", "as an ai", "i'm unable",
  "i apologize", "i'm sorry, but", "i don't feel comfortable",
  "i'm not going to", "i am not going to",
];

// "up" removed — conflicts with "Set Up" as a valid action verb starter
const LOWERCASE_TITLE_WORDS = new Set([
  'a','an','the','and','but','or','for','of','in','on','at','to','by','as','vs',
]);

// Pre-compiled regexes
const REPEAT_RX    = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
const FILLER_RX    = /^(i need to|i have to|i want to|i must|i should|can you please|can you|please help me to|please help me|please|help me to|help me|i am going to|i am gonna|gonna|gotta|i'd like to|i'd love to|i would like to|remind me to|don't forget to)\s+/i;
const STEP_LEAD_RX = /^\s*(\d+[.)]\s*|[-*•]\s*)/;  // removes "1. ", "- ", "• " but NOT "1st"
const WHEN_RX      = /^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}\.\d{2} (am|pm)$/;
const CONTROL_RX   = /[\u0000-\u001F\u200B-\u200D\uFEFF]/g;
const INJECTION_RX = /["\\]/g;

const MONTHS        = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveModel() {
  const requested = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  return ALLOWED_MODELS.includes(requested) ? requested : 'llama-3.1-8b-instant';
}

function fmtDate(d) {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function nextWeekday(now, targetDow) {
  const d    = new Date(now);
  const diff = ((targetDow - d.getUTCDay()) + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function buildDateContext() {
  const now         = new Date();
  const tomorrow    = new Date(now); tomorrow.setUTCDate(now.getUTCDate() + 1);
  const nextWeekend = nextWeekday(now, 6);
  const nextWeek    = new Date(now); nextWeek.setUTCDate(now.getUTCDate() + 7);
  const endOfWeek   = nextWeekday(now, 5);

  return [
    `Today         : ${fmtDate(now)}`,
    `Tonight       : ${fmtDate(now)}  (use 9.00 pm unless a time is given)`,
    `Tomorrow      : ${fmtDate(tomorrow)}`,
    `This weekend  : ${fmtDate(nextWeekend)}`,
    `End of week   : ${fmtDate(endOfWeek)}`,
    `Next week     : ${fmtDate(nextWeek)}`,
    '',
    ...WEEKDAY_NAMES.map((name, i) => `Next ${name.padEnd(10)}: ${fmtDate(nextWeekday(now, i))}`),
  ].join('\n');
}

const DURATION_REFERENCE = `
DURATION REFERENCE:
  Quick actions (2-5 min)  : boil water, send a short message, take a photo
  Short tasks  (5-15 min)  : write an email, pay a bill, book an appointment
  Medium tasks (15-30 min) : write a report section, cook a simple meal, clean one room
  Longer tasks (30-60 min) : write a full report, prepare a presentation, deep-clean a room
  Extended     (60-90 min) : write a detailed document, build a small feature, full grocery shop

Rules:
  - Maximum 90 min per step — split anything longer into smaller sub-steps
  - Minimum 3 min per step
  - Travel = 15-30 min minimum
  - Research = 15-45 min
  - Review/edit = at least 10 min
  - Set up/prepare = 5-20 min
  - Use varied realistic values — NOT everything rounded to 5 or 10
  - totalDurationMinutes MUST equal the exact sum of stepDurations`;

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) =>
      (i === 0 || !LOWERCASE_TITLE_WORDS.has(word))
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ');
}

function sanitiseTitle(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim().replace(/[.!?,;:]+$/, '');
  t = toTitleCase(t);
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 6) t = words.slice(0, 6).join(' ');
  return t.trim().length >= 2 ? t.trim() : null;
}

function sanitiseStep(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim()
    .replace(STEP_LEAD_RX, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!s) return null;
  s = s.charAt(0).toUpperCase() + s.slice(1);
  const words = s.split(/\s+/);
  if (words.length > 15) s = words.slice(0, 15).join(' ');
  return s.trim() || null;
}

function cleanTaskInput(raw) {
  let t = raw
    .replace(INJECTION_RX, "'")   // sanitise prompt injection chars
    .replace(REPEAT_RX, '$1')
    .replace(REPEAT_RX, '$1')
    .replace(FILLER_RX, '')
    .replace(FILLER_RX, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return t;
}

function neutraliseTask(t) {
  return t
    .replace(/\b([A-Z][a-zA-Z]+)\s+(?:vs\.?|versus|and)\s+([A-Z][a-zA-Z]+)\s+(war|conflict|battle|crisis|fight|clash)\b/gi, 'geopolitical conflict')
    .replace(/\b(war|conflict|battle|crisis)\s+between\s+[A-Z][a-zA-Z]+\s+and\s+[A-Z][a-zA-Z]+\b/gi, 'geopolitical conflict');
}

function validateTaskMeaning(input) {
  const t     = input.trim();
  const lower = t.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  if (t.length < MIN_TASK_LENGTH)
    return 'Please describe your task in a few words.';

  if (!/[a-zA-Z]/.test(t))
    return "That doesn't look like a task. Please describe what you need to do.";

  if (!/[a-zA-Z]{3,}/.test(t))
    return "That doesn't look like a task. Please describe what you need to do.";

  const noSpaces = lower.replace(/\s/g, '');
  if (noSpaces.length >= 4 && /^(.)\1+$/.test(noSpaces))
    return 'Your input looks like random text. Please describe a real task.';

  if (words.some(w => OFFENSIVE_WORDS.has(w.replace(/[^a-z]/g, ''))))
    return "That doesn't look like a task. Please enter something you actually need to do.";

  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].replace(/[^a-z]/g, '')))
    return "That's too vague. Try something like \"Buy groceries tomorrow at 5pm\".";

  return null;
}

function buildPrompt(task) {
  const dateCtx = buildDateContext();

  return `You are a helpful daily task planner. Break the user's task into 3-6 simple, clear steps with REALISTIC time estimates.

════════════════════════════════
DATE REFERENCE — look up dates here, never compute yourself:
${dateCtx}
════════════════════════════════
${DURATION_REFERENCE}
════════════════════════════════

TASK: '${task}'

Return ONLY a raw JSON object — no markdown, no code fences, no explanation.

Format (no date/time):
{ "title": "...", "steps": ["step 1", "step 2"], "stepDurations": [15, 30], "totalDurationMinutes": 45, "category": "..." }

Format (with date/time — include "when"):
{ "title": "...", "steps": [...], "stepDurations": [...], "totalDurationMinutes": 0, "category": "...", "when": "..." }

════════════════════════════════
TITLE
════════════════════════════════
• 3-5 words, Title Case, starts with action verb
• Verbs: Create, Fix, Buy, Write, Plan, Call, Review, Build, Send, Prepare, Book,
  Complete, Schedule, Finish, Make, Draft, Submit, Organise, Set Up, Go, Run,
  Eat, Visit, Study, Clean, Cook, Research
• No punctuation at end, no filler words ("I need to", "please", "remind me to")

Examples:
  "I need to create a report about AI"  →  "Create AI Report"
  "buy some milk at the store tomorrow" →  "Buy Milk at Store"
  "fix the login bug in my app"         →  "Fix Login Bug"
  "run"                                 →  "Go for a Run"

════════════════════════════════
STEPS
════════════════════════════════
• Exactly 3-6 steps — never fewer, never more
• Each step: one sentence, max 8 words, starts with action verb
• Logical order: prepare → main action → review → finish
• No duplicates, no vague filler steps ("Get started", "You're done")
• No compound steps joined with "and" or "then"

════════════════════════════════
DURATIONS
════════════════════════════════
• stepDurations: one integer (minutes) per step, same order as steps
• Min 3 min per step, max 90 min per step
• If a step would take longer than 90 min, break it into smaller sub-steps
• Use the DURATION REFERENCE above — varied realistic values, NOT everything rounded to 5 or 10
• totalDurationMinutes MUST equal the exact arithmetic sum of stepDurations

════════════════════════════════
WHEN (only if date/time mentioned)
════════════════════════════════
• Look up date ONLY from DATE REFERENCE above — never calculate yourself
• Strict format: "D Mon YYYY, h.mm am/pm"  e.g. "22 Mar 2026, 6.00 pm"
• Time only → today + that time
• Day only → that date + 5.00 pm default
• "tonight" → today + 9.00 pm (or stated time)
• "this weekend" → weekend date + 5.00 pm
• No date/time mentioned → omit "when" key entirely

════════════════════════════════
CATEGORY
════════════════════════════════
Pick exactly one: Work | Shopping | Health | Finance | Creative | Personal | Other

• Work     — reports, meetings, coding, emails, presentations, professional tasks
• Shopping — buying items, groceries, orders (not medicine)
• Health   — exercise, doctor, medicine, fitness, diet, mental health
• Finance  — payments, bills, budgets, banking, investments, taxes
• Creative — art, writing stories/poems, music, design, video, photography
• Personal — family, home, social plans, hobbies, self-care, errands
• Other    — does not clearly fit any above`;
}

function parseResponse(text) {
  const empty = {
    title: null, steps: [], stepDurations: [], totalDurationMinutes: 0,
    category: 'Other', when: null, _refusal: false,
  };

  if (!text || typeof text !== 'string') return empty;

  // Only check for refusals in text before the first JSON object to avoid
  // false positives from legitimate step content like "I can't find a plumber"
  const preJson = text.indexOf('{') > -1
    ? text.slice(0, text.indexOf('{')).toLowerCase()
    : text.toLowerCase();

  if (REFUSAL_PHRASES.some(p => preJson.includes(p))) {
    console.warn('[aiController] Refusal detected. Raw:', text.slice(0, 200));
    return { ...empty, _refusal: true };
  }

  const stripped = text.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController] JSON parse failed:', stripped.slice(0, 200));
    const lines = stripped
      .split('\n')
      .map(s => sanitiseStep(s))
      .filter(s => s && s.length > 4 && /[a-zA-Z]{3,}/.test(s));
    return { ...empty, steps: lines.slice(0, 6) };
  }

  const title = sanitiseTitle(typeof parsed.title === 'string' ? parsed.title : '');

  let steps = [];
  if (Array.isArray(parsed.steps)) {
    const seen = new Set();
    steps = parsed.steps
      .map(s => sanitiseStep(s))
      .filter(s => {
        if (!s || s.length <= 4 || !/[a-zA-Z]{3,}/.test(s)) return false;
        const key = s.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }

  let stepDurations = [];
  if (Array.isArray(parsed.stepDurations)) {
    stepDurations = parsed.stepDurations
      .map(d => (typeof d === 'number' && Number.isFinite(d) && d > 0)
        ? Math.min(MAX_STEP_MINUTES, Math.max(3, Math.round(d)))
        : 5)
      .slice(0, steps.length);
  }
  while (stepDurations.length < steps.length) stepDurations.push(5);

  // Always recompute — never trust the model's arithmetic
  const totalDurationMinutes = stepDurations.reduce((a, b) => a + b, 0);

  const validCategories = Object.keys(CATEGORY_META);
  const rawCat          = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  const category        = validCategories.includes(rawCat) ? rawCat : 'Other';

  let when = null;
  if (typeof parsed.when === 'string' && parsed.when.trim()) {
    const whenStr = parsed.when.trim();
    if (WHEN_RX.test(whenStr)) {
      when = whenStr;
    } else {
      console.warn('[aiController] "when" failed format check, dropping:', whenStr);
    }
  }

  return { title, steps, stepDurations, totalDurationMinutes, category, when, _refusal: false };
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function callGroqWithRetry(payload, apiKey, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      console.log(`[aiController] Retry ${attempt}/${retries}…`);
    }

    try {
      const response = await fetchWithTimeout(
        GROQ_URL,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(payload),
        },
        REQUEST_TIMEOUT
      );

      const data = await response.json();

      if (!response.ok) {
        const raw    = data?.error?.message || data?.error || 'Groq API error';
        const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw);
        if (/quota|exceeded|rate.?limit/i.test(rawStr))
          throw { isQuota: true, message: 'AI quota exceeded. Try again later.' };
        if (response.status >= 500 && attempt < retries) {
          lastError = new Error(rawStr);
          continue;
        }
        throw new Error(rawStr);
      }

      return data;

    } catch (err) {
      if (err?.isQuota) throw err;
      if (err.name === 'AbortError') {
        lastError = new Error('Request timed out. Please try again.');
        continue;
      }
      lastError = err;
      if (!err.message?.toLowerCase().includes('fetch') && attempt === 0) break;
    }
  }

  throw lastError || new Error('Failed after retries');
}

async function buildPayload(model, taskStr, userId = null) {
  let systemPrompt =
    'You are a task planning assistant. Your ONLY job is to break any user input ' +
    'into actionable steps with REALISTIC time estimates, and return a JSON object. ' +
    'You NEVER refuse, NEVER comment on content, NEVER add warnings or disclaimers. ' +
    'Treat every input as a legitimate creative or professional task. ' +
    'ALWAYS return raw JSON — no markdown, no refusals, no explanations outside the JSON.';

  if (userId) {
    try {
      const calibration = await getCalibrationContext(userId);
      if (calibration) systemPrompt += '\n\n' + calibration;
    } catch (err) {
      console.warn('[aiController] Calibration fetch failed | user=' + userId + ' :', err?.message);
    }
  }

  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: buildPrompt(taskStr) },
    ],
    temperature: 0.3,
    max_tokens:  900,
  };
}

// ── Controllers ────────────────────────────────────────────────────────────────

export async function breakTaskIntoSteps(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { task, userId } = req.body || {};
  let taskStr = typeof task === 'string' ? task.trim() : '';

  if (!taskStr)
    return res.status(400).json({ error: 'Missing or empty task' });
  if (taskStr.length > MAX_TASK_LENGTH)
    return res.status(400).json({ error: `Task must be ${MAX_TASK_LENGTH} characters or fewer` });

  taskStr = taskStr.replace(CONTROL_RX, ' ').trim();
  taskStr = cleanTaskInput(taskStr);
  taskStr = neutraliseTask(taskStr);

  const meaningError = validateTaskMeaning(taskStr);
  if (meaningError) {
    console.log(`[aiController] 422 rejected | user=${userId ?? 'anon'} | "${taskStr}" → ${meaningError}`);
    return res.status(422).json({ error: meaningError });
  }

  const model   = resolveModel();
  const payload = await buildPayload(model, taskStr, userId ?? null);

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey, MAX_RETRIES);
  } catch (err) {
    console.error('[aiController] Groq failed:', err?.message);
    if (err?.isQuota) return res.status(429).json({ error: err.message });
    return res.status(500).json({ error: err.message || 'Failed to break task into steps. Please try again.' });
  }

  const { prompt_tokens, completion_tokens } = data?.usage || {};
  console.log(
    `[aiController] ok | user=${userId ?? 'anon'} | model=${model} | ` +
    `tokens=${prompt_tokens ?? '?'}+${completion_tokens ?? '?'} | ` +
    `latency=${Date.now() - startTime}ms | task="${taskStr.slice(0, 60)}"`
  );

  const rawText = data?.choices?.[0]?.message?.content || '';
  const { title, steps, stepDurations, totalDurationMinutes, category, when, _refusal } =
    parseResponse(rawText);

  if (_refusal) {
    console.warn('[aiController] Refusal detected, retrying with neutral framing…');
    const retryPayload = await buildPayload(model, `Create a detailed project plan for: ${taskStr}`);

    try {
      const retryData = await callGroqWithRetry(retryPayload, apiKey, 1);
      const retried   = parseResponse(retryData?.choices?.[0]?.message?.content || '');

      if (retried.steps.length >= 1 && !retried._refusal) {
        const { emoji, iconBg } = CATEGORY_META[retried.category] ?? CATEGORY_META['Other'];
        return res.json({
          title: retried.title ?? taskStr,
          steps: retried.steps,
          stepDurations: retried.stepDurations,
          totalDurationMinutes: retried.totalDurationMinutes,
          category: retried.category,
          emoji,
          iconBg,
          suggestSplit: retried.totalDurationMinutes > 90,
          ...(retried.when ? { when: retried.when } : {}),
        });
      }
    } catch (retryErr) {
      console.error('[aiController] Retry after refusal failed:', retryErr?.message);
    }

    return res.status(422).json({ error: "Try rephrasing your task — e.g. 'Plan an AI conflict video project'" });
  }

  if (steps.length < 1) {
    console.warn('[aiController] 0 valid steps parsed. Raw:', rawText.slice(0, 300));
    return res.status(500).json({ error: 'AI returned no usable steps. Please try rephrasing your task.' });
  }

  const { emoji, iconBg } = CATEGORY_META[category] ?? CATEGORY_META['Other'];

  return res.json({
    title: title ?? taskStr,
    steps,
    stepDurations,
    totalDurationMinutes,
    category,
    emoji,
    iconBg,
    suggestSplit: totalDurationMinutes > 90,
    ...(when ? { when } : {}),
  });
}

export async function rescheduleTask(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { instruction, currentDueDate, userId } = req.body || {};

  if (!instruction || typeof instruction !== 'string' || !instruction.trim())
    return res.status(400).json({ error: 'Missing or empty instruction' });
  if (!currentDueDate || typeof currentDueDate !== 'string' || !currentDueDate.trim())
    return res.status(400).json({ error: 'Missing or empty currentDueDate' });

  const safeInstruction = instruction.trim().replace(INJECTION_RX, "'").slice(0, 200);
  const safeDueDate     = currentDueDate.trim().replace(INJECTION_RX, "'").slice(0, 50);
  const dateCtx         = buildDateContext();

  const prompt = `You are a date parser. The user wants to reschedule a task.

════════════════════════════════
DATE REFERENCE — look up dates here, NEVER compute yourself:
${dateCtx}
════════════════════════════════

Current due date : '${safeDueDate}'
User instruction : '${safeInstruction}'

Return ONLY a raw JSON object:
{ "newDueDate": "D Mon YYYY, h.mm am/pm" }

Rules:
- Look up target date from DATE REFERENCE
- Strict format: "D Mon YYYY, h.mm am/pm"  e.g. "23 Mar 2026, 5.00 pm"
- Day change only → keep original time
- Time change only → keep original date
- Ambiguous → default to 5.00 pm`;

  const model   = resolveModel();
  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are a date parsing assistant. Return ONLY a raw JSON object with a newDueDate field. No markdown, no explanation.' },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.1,
    max_tokens:  80,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey, MAX_RETRIES);
  } catch (err) {
    console.error('[aiController:reschedule] Groq failed:', err?.message);
    if (err?.isQuota) return res.status(429).json({ error: err.message });
    return res.status(500).json({ error: err.message || 'Failed to reschedule. Please try again.' });
  }

  const rawText  = data?.choices?.[0]?.message?.content || '';
  const stripped = rawText.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController:reschedule] JSON parse failed:', stripped.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse rescheduled date. Please try again.' });
  }

  const newDueDate = typeof parsed.newDueDate === 'string' ? parsed.newDueDate.trim() : '';
  if (!WHEN_RX.test(newDueDate)) {
    console.warn('[aiController:reschedule] Invalid date format:', newDueDate);
    return res.status(500).json({ error: 'AI returned an invalid date format. Please try again.' });
  }

  console.log(`[aiController:reschedule] ok | user=${userId ?? 'anon'} | latency=${Date.now() - startTime}ms | "${safeInstruction}" → "${newDueDate}"`);
  return res.json({ newDueDate });
}

export async function suggestSplit(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { task, steps, totalDurationMinutes, userId } = req.body || {};

  if (!task || typeof task !== 'string' || !task.trim())
    return res.status(400).json({ error: 'Missing or empty task' });
  if (!Array.isArray(steps) || steps.length === 0)
    return res.status(400).json({ error: 'Missing or empty steps array' });
  if (typeof totalDurationMinutes !== 'number' || totalDurationMinutes <= 0)
    return res.status(400).json({ error: 'Missing or invalid totalDurationMinutes' });

  const safeTask  = task.trim().replace(INJECTION_RX, "'").slice(0, MAX_TASK_LENGTH);
  const safeSteps = steps
    .slice(0, 10)
    .map(s => typeof s === 'string' ? s.replace(INJECTION_RX, "'").slice(0, 100) : '')
    .filter(Boolean);

  const stepsText = safeSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = `You are a task planning assistant. Split this long task into 2-3 smaller tasks, each under 90 minutes.

${DURATION_REFERENCE}

Original task : '${safeTask}'
Total duration: ${totalDurationMinutes} minutes
Current steps :
${stepsText}

Each smaller task must:
- Be completable in under 90 minutes
- Have a clear title (3-5 words, Title Case, starts with action verb)
- Have 2-4 steps (each max 8 words, starts with action verb)
- Have realistic stepDurations (min 3, max 90 per step)
- Have totalDurationMinutes = exact sum of its stepDurations
- Together cover all the work of the original

Return ONLY a raw JSON object:
{
  "splitTasks": [
    { "title": "...", "steps": ["...", "..."], "stepDurations": [20, 30], "totalDurationMinutes": 50 }
  ]
}`;

  const model   = resolveModel();
  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are a task splitting assistant. Return ONLY raw JSON. No markdown, no explanation.' },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.3,
    max_tokens:  800,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey, MAX_RETRIES);
  } catch (err) {
    console.error('[aiController:suggestSplit] Groq failed:', err?.message);
    if (err?.isQuota) return res.status(429).json({ error: err.message });
    return res.status(500).json({ error: err.message || 'Failed to split task. Please try again.' });
  }

  const rawText  = data?.choices?.[0]?.message?.content || '';
  const stripped = rawText.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController:suggestSplit] JSON parse failed:', stripped.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse split tasks. Please try again.' });
  }

  if (!Array.isArray(parsed.splitTasks) || parsed.splitTasks.length === 0)
    return res.status(500).json({ error: 'AI returned no split tasks. Please try again.' });

  const splitTasks = parsed.splitTasks
    .slice(0, 3)
    .map(t => {
      const title = sanitiseTitle(typeof t.title === 'string' ? t.title : '') ?? safeTask;

      let taskSteps = [];
      if (Array.isArray(t.steps)) {
        taskSteps = t.steps.map(s => sanitiseStep(s)).filter(s => s && s.length > 2);
      }
      if (taskSteps.length === 0) return null;

      let durations = [];
      if (Array.isArray(t.stepDurations)) {
        durations = t.stepDurations
          .map(d => (typeof d === 'number' && d > 0)
            ? Math.min(MAX_STEP_MINUTES, Math.max(3, Math.round(d)))
            : 5)
          .slice(0, taskSteps.length);
      }
      while (durations.length < taskSteps.length) durations.push(5);

      return {
        title,
        steps: taskSteps,
        stepDurations: durations,
        totalDurationMinutes: durations.reduce((a, b) => a + b, 0),
      };
    })
    .filter(Boolean);

  if (splitTasks.length === 0)
    return res.status(500).json({ error: 'AI returned unusable split tasks. Please try again.' });

  console.log(`[aiController:suggestSplit] ok | user=${userId ?? 'anon'} | latency=${Date.now() - startTime}ms | "${safeTask.slice(0, 60)}" → ${splitTasks.length} tasks`);
  return res.json({ splitTasks });
}

export async function getDailyPlan(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { tasks, availableMinutes, userId } = req.body || {};

  if (!Array.isArray(tasks) || tasks.length === 0)
    return res.status(400).json({ error: 'Missing or empty tasks array' });
  if (typeof availableMinutes !== 'number' || availableMinutes <= 0)
    return res.status(400).json({ error: 'Missing or invalid availableMinutes' });

  const dateCtx  = buildDateContext();
  const taskList = tasks
    .slice(0, 20)
    .map((t, i) => {
      const due     = t.dueDate     ? `due: ${t.dueDate}`         : 'no due date';
      const session = t.sessionTime ? `${t.sessionTime}min logged` : 'not started';
      return `${i + 1}. [${t.id}] "${t.title}" | ${t.category} | ${due} | status: ${t.status} | ${session}`;
    })
    .join('\n');

  const prompt = `You are a daily productivity planner. Suggest the best order to tackle pending tasks given available time.

════════════════════════════════
DATE REFERENCE:
${dateCtx}
════════════════════════════════

Available today : ${availableMinutes} minutes
Pending tasks:
${taskList}

Priority rules:
- Tasks due today or overdue → first
- Earlier due dates → higher priority than no due date
- In-progress tasks → above equal-urgency todo tasks
- Tasks with time already logged → keep high
- Shorter tasks early → build momentum
- Do NOT include done tasks

Return ONLY a raw JSON object:
{
  "orderedTaskIds": ["id1", "id2"],
  "reasoning": { "id1": "One sentence why this is first", "id2": "..." }
}

Only use IDs from the list above. reasoning must have one entry per orderedTaskId.`;

  const model   = resolveModel();
  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are a daily planner. Return ONLY raw JSON with orderedTaskIds and reasoning. No markdown, no refusals.' },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.2,
    max_tokens:  600,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey, MAX_RETRIES);
  } catch (err) {
    console.error('[aiController:getDailyPlan] Groq failed:', err?.message);
    if (err?.isQuota) return res.status(429).json({ error: err.message });
    return res.status(500).json({ error: err.message || 'Failed to generate daily plan. Please try again.' });
  }

  const rawText  = data?.choices?.[0]?.message?.content || '';
  const stripped = rawText.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController:getDailyPlan] JSON parse failed:', stripped.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse daily plan. Please try again.' });
  }

  if (!Array.isArray(parsed.orderedTaskIds) || parsed.orderedTaskIds.length === 0)
    return res.status(500).json({ error: 'AI returned no task order. Please try again.' });

  const validIds       = new Set(tasks.map(t => t.id));
  const orderedTaskIds = parsed.orderedTaskIds.filter(id => validIds.has(id));

  if (orderedTaskIds.length === 0)
    return res.status(500).json({ error: 'AI returned unrecognised task IDs. Please try again.' });

  // Surface any pending tasks the model silently omitted so the frontend can decide what to do
  const droppedTaskIds = tasks
    .filter(t => t.status !== 'done' && !orderedTaskIds.includes(t.id))
    .map(t => t.id);

  const reasoning = {};
  if (parsed.reasoning && typeof parsed.reasoning === 'object') {
    for (const id of orderedTaskIds) {
      const r = parsed.reasoning[id];
      if (typeof r === 'string' && r.trim()) reasoning[id] = r.trim();
    }
  }

  console.log(`[aiController:getDailyPlan] ok | user=${userId ?? 'anon'} | latency=${Date.now() - startTime}ms | ${orderedTaskIds.length} ordered, ${droppedTaskIds.length} dropped`);
  return res.json({
    orderedTaskIds,
    reasoning,
    ...(droppedTaskIds.length > 0 ? { droppedTaskIds } : {}),
  });
}