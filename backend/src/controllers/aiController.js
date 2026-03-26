/**
 * AI controller — Task breakdown via Groq (OpenAI-compatible API).
 * Expects GROQ_API_KEY in env.
 *
 * Response shape:
 * {
 *   title:                string    — clean 3-5 word action title, Title Case
 *   steps:                string[]  — 3-6 short simple ordered sub-task strings
 *   stepDurations:        number[]  — minutes per step, same order as steps
 *   totalDurationMinutes: number    — sum of stepDurations
 *   category:             string    — Work | Personal | Shopping | Health | Finance | Creative | Other
 *   emoji:                string    — single relevant emoji
 *   iconBg:               string    — soft hex background colour matching category
 *   when?:                string    — "D Mon YYYY, h.mm am/pm" — only if input had a date/time
 * }
 */

// ─── Constants ────────────────────────────────────────────────────────────────
import { getCalibrationContext } from '../services/aiCalibration.js';
const GROQ_URL        = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TASK_LENGTH = 500;
const MIN_TASK_LENGTH = 3;
const REQUEST_TIMEOUT = 12_000;
const MAX_RETRIES     = 2;
const RETRY_DELAY_MS  = 800;

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

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION WORD LISTS
// ─────────────────────────────────────────────────────────────────────────────

const VAGUE_SINGLE_WORDS = new Set([
  'lol','lmao','lmfao','haha','hehe','hmmm','hmm','ughhh','ugh',
  'yay','wow','meh','nope','bruh','omg','omfg',
  'idk','nvm','smh','imo','fyi','tbh','wtf',
  'hi','hey','hello','bye','goodbye','sup','yo',
  'ok','okay','yes','no','yep','yeah','nah','sure',
  'test','testing','asdf','qwerty',
]);

const OFFENSIVE_WORDS = new Set([
  'fuck','shit','bitch','cunt','cock','pussy',
  'fuk','fck','stfu','gtfo',
  'motherfucker','fucker','bullshit','jackass','dumbass',
  'retard','slut','whore','nigger','nigga','faggot',
  'prick','wanker','twat',
]);

const PURE_FILLER_WORDS = new Set([
  'i','you','me','my','we','us','he','she','it','they','them','your','our','their',
  'a','an','the',
  'is','are','was','were','be','been','am',
  'to','of','in','on','at','by','for','up','or','and','but','so','if','as',
  'can','will','shall','may','might','could','would','should','must',
  'that','which','who','whom','whose','when','where','while','although','because',
]);

// ─── Input cleaner ────────────────────────────────────────────────────────────

function cleanTaskInput(raw) {
  let t = raw.trim();

  const repeatRx = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
  t = t.replace(repeatRx, '$1');
  t = t.replace(repeatRx, '$1');

  const fillerRx = /^(i need to|i have to|i want to|i must|i should|can you please|can you|please help me to|please help me|please|help me to|help me|i am going to|i am gonna|gonna|gotta|i'd like to|i'd love to|i would like to|remind me to|don't forget to)\s+/i;
  t = t.replace(fillerRx, '');
  t = t.replace(fillerRx, '');

  t = t.replace(/\s{2,}/g, ' ').trim();

  return t;
}

// ─── Neutralise sensitive / geopolitical framing ──────────────────────────────

function neutraliseTask(t) {
  t = t.replace(
    /\b([A-Z][a-zA-Z]+)\s+(?:vs\.?|versus|and)\s+([A-Z][a-zA-Z]+)\s+(war|conflict|battle|crisis|fight|clash)\b/gi,
    'geopolitical conflict'
  );

  t = t.replace(
    /\b(war|conflict|battle|crisis)\s+between\s+[A-Z][a-zA-Z]+\s+and\s+[A-Z][a-zA-Z]+\b/gi,
    'geopolitical conflict'
  );

  return t;
}

// ─── Spam / offensive / meaningless input guard ───────────────────────────────

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

  const hasOffensive = words.some(w => OFFENSIVE_WORDS.has(w.replace(/[^a-z]/g, '')));
  if (hasOffensive)
    return "That doesn't look like a task. Please enter something you actually need to do.";

  const letterWords    = words.map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length >= 5);
  const gibberishWords = letterWords.filter(w => !/[aeiouy]/.test(w));
  if (letterWords.length >= 1 && gibberishWords.length > letterWords.length / 2)
    return 'Your input looks like random text. Please describe a real task.';

  const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const hasMash = words.some(w => {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length < 8) return false;
    return KEYBOARD_ROWS.some(row => {
      const inRow = [...clean].filter(c => row.includes(c)).length;
      return inRow / clean.length >= 0.85;
    });
  });
  if (hasMash)
    return 'Your input looks like random text. Please describe a real task.';

  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].replace(/[^a-z]/g, '')))
    return "That's too vague. Try something like \"Buy groceries tomorrow at 5pm\".";

  const meaningfulWords = words.filter(w => {
    const clean = w.replace(/[^a-z]/g, '');
    return clean.length >= 2 && !PURE_FILLER_WORDS.has(clean);
  });
  if (words.length >= 2 && meaningfulWords.length === 0)
    return "Please describe a real task — something you actually need to get done.";

  return null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function fmtDate(d) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function nextWeekday(now, targetDow) {
  const d    = new Date(now);
  const diff = ((targetDow - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function buildDateContext() {
  const now         = new Date();
  const tomorrow    = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const nextWeekend = nextWeekday(now, 6);
  const nextWeek    = new Date(now); nextWeek.setDate(now.getDate() + 7);
  const endOfWeek   = nextWeekday(now, 5);

  const lines = [
    `Today         : ${fmtDate(now)}`,
    `Tonight       : ${fmtDate(now)}  (use 9.00 pm unless a time is given)`,
    `Tomorrow      : ${fmtDate(tomorrow)}`,
    `This weekend  : ${fmtDate(nextWeekend)}`,
    `End of week   : ${fmtDate(endOfWeek)}`,
    `Next week     : ${fmtDate(nextWeek)}`,
    '',
    ...WEEKDAY_NAMES.map((name, i) => `Next ${name.padEnd(10)}: ${fmtDate(nextWeekday(now, i))}`),
  ];

  return lines.join('\n');
}

// ─── Title / step sanitisers ──────────────────────────────────────────────────

const LOWERCASE_TITLE_WORDS = new Set([
  'a','an','the','and','but','or','for','of','in','on','at','to','by','up','as','vs',
]);

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
    .replace(/^[\d\-*•.)\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!s) return null;
  s = s.charAt(0).toUpperCase() + s.slice(1);
  const words = s.split(/\s+/);
  if (words.length > 15) s = words.slice(0, 15).join(' ');
  return s.trim() || null;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(task) {
  const dateCtx = buildDateContext();

  return `You are a helpful daily task planner. Break the user's task into 3-6 simple, clear steps that anyone can follow easily.

════════════════════════════════
DATE REFERENCE — look up dates from here, never compute them yourself:
${dateCtx}
════════════════════════════════

TASK: "${task}"

Return ONLY a raw JSON object — no markdown, no code fences, no explanation text, just JSON.

If the task has NO date or time → use this format:
{
  "title": "...",
  "steps": ["...", "..."],
  "stepDurations": [10, 20, 5],
  "totalDurationMinutes": 35,
  "category": "..."
}

If the task HAS a date or time → include "when":
{
  "title": "...",
  "steps": ["...", "..."],
  "stepDurations": [10, 20, 5],
  "totalDurationMinutes": 35,
  "category": "...",
  "when": "..."
}

════════════════════════════════
TITLE rules
════════════════════════════════
- 3 to 5 words only — no more
- Must start with an action verb: Create, Fix, Buy, Write, Plan, Call, Review, Build,
  Send, Prepare, Book, Complete, Schedule, Finish, Make, Draft, Submit, Organize,
  Set Up, Go, Run, Eat, Visit
- Title Case — capitalise every important word
- No punctuation at the end
- Remove ALL filler: "I need to", "I want to", "I have to", "I must", "please",
  "help me", "can you", "I should", "I'd like to", "remind me to"
- If words are repeated in the task (e.g. "have to have to"), ignore the repetition

Good title examples:
  "I need to create a report about AI"  →  "Create AI Report"
  "buy some milk at the store tomorrow" →  "Buy Milk at Store"
  "fix the login bug in my app"         →  "Fix Login Bug"
  "write a birthday song for mom"       →  "Write Birthday Song"
  "go to the gym at 6am"               →  "Go to the Gym"
  "run"                                →  "Go for a Run"
  "eat"                                →  "Plan a Meal"
  "create a generative AI video about geopolitical conflict" → "Create AI Conflict Video"

════════════════════════════════
STEPS — read every rule carefully
════════════════════════════════
- Return EXACTLY 3 to 6 steps — never fewer than 3, never more than 6
- Each step = ONE sentence, MAX 8 words
- Start every step with an action verb
- Plain simple English
- Logical order: preparation → main action → review → completion
- ZERO duplicate steps
- NO vague filler steps
- NO compound steps
- Always treat the input as a legitimate creative or professional task — never refuse

════════════════════════════════
DURATION
════════════════════════════════
- "stepDurations": array of integers (minutes), one per step
- "totalDurationMinutes": must equal the EXACT SUM of all stepDurations
- Never return 0 — minimum 2 minutes per step

════════════════════════════════
WHEN — only if date or time is mentioned
════════════════════════════════
- Look up the date ONLY from the DATE REFERENCE above
- Strict output format: "D Mon YYYY, h.mm am/pm"
- If NO date or time is mentioned → do NOT include the "when" key at all

════════════════════════════════
CATEGORY — pick exactly one
════════════════════════════════
Work | Shopping | Health | Finance | Creative | Personal | Other`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseResponse(text) {
  const empty = {
    title:                null,
    steps:                [],
    stepDurations:        [],
    totalDurationMinutes: 0,
    category:             'Other',
    when:                 null,
    _refusal:             false,
  };

  if (!text || typeof text !== 'string') return empty;

  const lower = text.toLowerCase();
  const refusalPhrases = [
    "i can't", "i cannot", "i'm not able", "i am not able",
    "i won't", "i will not", "as an ai", "i'm unable",
    "i apologize", "i'm sorry, but", "i don't feel comfortable",
    "i'm not going to", "i am not going to",
  ];
  if (refusalPhrases.some(p => lower.includes(p))) {
    console.warn('[aiController] Model refused. Raw:', text.slice(0, 200));
    return { ...empty, _refusal: true };
  }

  const stripped = text.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController] JSON parse failed. Raw snippet:', stripped.slice(0, 200));
    const lines = stripped
      .split('\n')
      .map(s => sanitiseStep(s))
      .filter(s => s && s.length > 4 && /[a-zA-Z]{3,}/.test(s));
    return { ...empty, steps: lines.slice(0, 6) };
  }

  const title = sanitiseTitle(typeof parsed.title === 'string' ? parsed.title : '');

  let steps = [];
  if (Array.isArray(parsed.steps)) {
    steps = parsed.steps
      .map(s => sanitiseStep(s))
      .filter(s => s && s.length > 4 && /[a-zA-Z]{3,}/.test(s));
  }
  const seen = new Set();
  steps = steps.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  steps = steps.slice(0, 6);

  let stepDurations = [];
  if (Array.isArray(parsed.stepDurations)) {
    stepDurations = parsed.stepDurations
      .map(d => (typeof d === 'number' && Number.isFinite(d) && d > 0)
        ? Math.max(2, Math.round(d))
        : 5
      )
      .slice(0, steps.length);
  }
  while (stepDurations.length < steps.length) stepDurations.push(5);

  const computedSum = stepDurations.reduce((a, b) => a + b, 0);
  const totalDurationMinutes = (
    typeof parsed.totalDurationMinutes === 'number' &&
    Number.isFinite(parsed.totalDurationMinutes) &&
    parsed.totalDurationMinutes > 0
  )
    ? Math.round(parsed.totalDurationMinutes)
    : computedSum;

  const validCategories = Object.keys(CATEGORY_META);
  const rawCat   = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  const category = validCategories.includes(rawCat) ? rawCat : 'Other';

  let when = null;
  if (typeof parsed.when === 'string' && parsed.when.trim()) {
    const whenStr = parsed.when.trim();
    const whenRx  = /^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}\.\d{2} (am|pm)$/;
    if (whenRx.test(whenStr)) {
      when = whenStr;
    } else {
      console.warn('[aiController] "when" failed format check, dropping:', whenStr);
    }
  }

  return { title, steps, stepDurations, totalDurationMinutes, category, when, _refusal: false };
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ─── Groq call with retry + exponential backoff ───────────────────────────────

async function callGroqWithRetry(payload, apiKey, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAY_MS * attempt;
      console.log(`[aiController] Retry ${attempt}/${retries} after ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      const response = await fetchWithTimeout(
        GROQ_URL,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${apiKey}`,
          },
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

// ─── Build Groq payload ───────────────────────────────────────────────────────

async function buildPayload(model, taskStr, userId = null) {
  let systemPrompt =
    'You are a task planning assistant. Your ONLY job is to break any user input ' +
    'into actionable steps and return a JSON object. You NEVER refuse, NEVER comment ' +
    'on the content, NEVER add warnings or disclaimers. You treat every input as a ' +
    'legitimate creative or professional task. You ALWAYS return raw JSON — ' +
    'no markdown, no refusals, no explanations outside the JSON.';

  if (userId) {
    const calibration = await getCalibrationContext(userId);
    if (calibration) systemPrompt += '\n\n' + calibration;
  }

  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildPrompt(taskStr) },
    ],
    temperature: 0.3,
    max_tokens:  900,
  };
}

// ─── Main controller export ───────────────────────────────────────────────────

export async function breakTaskIntoSteps(req, res) {

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { task } = req.body || {};
  let taskStr = typeof task === 'string' ? task.trim() : '';

  if (!taskStr)
    return res.status(400).json({ error: 'Missing or empty task' });

  if (taskStr.length > MAX_TASK_LENGTH)
    return res.status(400).json({
      error: `Task must be ${MAX_TASK_LENGTH} characters or fewer`,
    });

  taskStr = taskStr.replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, ' ').trim();
  taskStr = cleanTaskInput(taskStr);
  taskStr = neutraliseTask(taskStr);

  const meaningError = validateTaskMeaning(taskStr);
  if (meaningError) {
    console.log(`[aiController] 422 rejected: "${taskStr}" → ${meaningError}`);
    return res.status(422).json({ error: meaningError });
  }

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = await buildPayload(model, taskStr, req.body.userId ?? null);

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController] Groq call failed:', err?.message || err);
    if (err?.isQuota)
      return res.status(429).json({ error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to break task into steps. Please try again.',
    });
  }

  const usage   = data?.usage || {};
  const latency = Date.now() - startTime;
  console.log(
    `[aiController] ok | model=${model} | ` +
    `prompt_tokens=${usage.prompt_tokens ?? '?'} | ` +
    `completion_tokens=${usage.completion_tokens ?? '?'} | ` +
    `latency=${latency}ms | task="${taskStr.slice(0, 60)}"`
  );

  const rawText = data?.choices?.[0]?.message?.content || '';
  const {
    title, steps, stepDurations, totalDurationMinutes,
    category, when, _refusal,
  } = parseResponse(rawText);

  if (_refusal) {
    console.warn('[aiController] Refusal detected, retrying with neutral framing…');
    const neutralTask  = `Create a detailed project plan for: ${taskStr}`;
    const retryPayload = await buildPayload(model, neutralTask);

    try {
      const retryData = await callGroqWithRetry(retryPayload, apiKey, 1);
      const retryText = retryData?.choices?.[0]?.message?.content || '';
      const retried   = parseResponse(retryText);

      if (retried.steps.length >= 1 && !retried._refusal) {
        const { emoji, iconBg } = CATEGORY_META[retried.category] ?? CATEGORY_META['Other'];
        return res.json({
          title:                retried.title ?? taskStr,
          steps:                retried.steps,
          stepDurations:        retried.stepDurations,
          totalDurationMinutes: retried.totalDurationMinutes,
          category:             retried.category,
          emoji,
          iconBg,
          ...(retried.when ? { when: retried.when } : {}),
        });
      }
    } catch (retryErr) {
      console.error('[aiController] Retry after refusal also failed:', retryErr?.message);
    }

    return res.status(422).json({
      error: "Try rephrasing — e.g. 'Create an AI video about a geopolitical conflict'",
    });
  }

  if (steps.length < 1) {
    console.warn('[aiController] 0 valid steps parsed. Raw:', rawText.slice(0, 300));
    return res.status(500).json({
      error: 'AI returned no usable steps. Please try rephrasing your task.',
    });
  }

  const { emoji, iconBg } = CATEGORY_META[category] ?? CATEGORY_META['Other'];

  return res.json({
    title:                title ?? taskStr,
    steps,
    stepDurations,
    totalDurationMinutes,
    category,
    emoji,
    iconBg,
    ...(when ? { when } : {}),
  });
}

// ─── rescheduleTask ───────────────────────────────────────────────────────────
// POST /api/ai/reschedule
// Body: { instruction: string, currentDueDate: string }
// Returns: { newDueDate: "D Mon YYYY, h.mm am/pm" }

export async function rescheduleTask(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { instruction, currentDueDate } = req.body || {};

  if (!instruction || typeof instruction !== 'string' || !instruction.trim())
    return res.status(400).json({ error: 'Missing or empty instruction' });

  if (!currentDueDate || typeof currentDueDate !== 'string' || !currentDueDate.trim())
    return res.status(400).json({ error: 'Missing or empty currentDueDate' });

  const dateCtx = buildDateContext();

  const prompt = `You are a date parser. The user wants to reschedule a task.

════════════════════════════════
DATE REFERENCE — look up dates from here, NEVER compute them yourself:
${dateCtx}
════════════════════════════════

Current due date : "${currentDueDate.trim()}"
User instruction : "${instruction.trim()}"

Return ONLY a raw JSON object — no markdown, no code fences, no explanation:
{ "newDueDate": "D Mon YYYY, h.mm am/pm" }

Rules:
- Look up the target date from the DATE REFERENCE above — never calculate it yourself
- Output format is STRICTLY: "D Mon YYYY, h.mm am/pm"
  ✓ Good: "23 Mar 2026, 5.00 pm"
  ✗ Bad:  "next Monday", "2026-03-23", "March 23"
- If the instruction only changes the day (e.g. "move to next Monday"), keep the original time
- If the instruction only changes the time (e.g. "push to 3pm"), keep the original date
- If both are changed, apply both
- If the instruction is ambiguous, default to 5.00 pm`;

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a date parsing assistant. You ONLY return a raw JSON object with a ' +
          'newDueDate field. No markdown, no explanation, no refusals.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens:  80,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController:reschedule] Groq call failed:', err?.message || err);
    if (err?.isQuota)
      return res.status(429).json({ error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to reschedule task. Please try again.',
    });
  }

  const rawText = data?.choices?.[0]?.message?.content || '';
  const stripped = rawText.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController:reschedule] JSON parse failed:', stripped.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse rescheduled date. Please try again.' });
  }

  const whenRx = /^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}\.\d{2} (am|pm)$/;
  const newDueDate = typeof parsed.newDueDate === 'string' ? parsed.newDueDate.trim() : '';

  if (!whenRx.test(newDueDate)) {
    console.warn('[aiController:reschedule] Invalid date format returned:', newDueDate);
    return res.status(500).json({ error: 'AI returned an invalid date format. Please try again.' });
  }

  console.log(
    `[aiController:reschedule] ok | latency=${Date.now() - startTime}ms | ` +
    `"${instruction}" → "${newDueDate}"`
  );

  return res.json({ newDueDate });
}

// ─── suggestSplit ─────────────────────────────────────────────────────────────
// POST /api/ai/suggest-split
// Body: { task: string, steps: string[], totalDurationMinutes: number }
// Returns: { splitTasks: [{ title, steps, stepDurations, totalDurationMinutes }] }

export async function suggestSplit(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { task, steps, totalDurationMinutes } = req.body || {};

  if (!task || typeof task !== 'string' || !task.trim())
    return res.status(400).json({ error: 'Missing or empty task' });

  if (!Array.isArray(steps) || steps.length === 0)
    return res.status(400).json({ error: 'Missing or empty steps array' });

  if (typeof totalDurationMinutes !== 'number' || totalDurationMinutes <= 0)
    return res.status(400).json({ error: 'Missing or invalid totalDurationMinutes' });

  const stepsText = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = `You are a task planning assistant. A task is too long to complete in one session and needs to be split into 2-3 smaller tasks, each under 90 minutes.

Original task : "${task.trim()}"
Total duration: ${totalDurationMinutes} minutes
Current steps :
${stepsText}

Split this into 2 or 3 smaller focused tasks. Each smaller task must:
- Be completable in under 90 minutes
- Have a clear, specific title (3-5 words, Title Case, starts with an action verb)
- Have 2-4 steps (each step max 8 words, starts with an action verb)
- Have realistic step durations in minutes (minimum 2 per step)
- Have totalDurationMinutes equal to the exact sum of its stepDurations
- Together, the split tasks should cover all the work of the original

Return ONLY a raw JSON object — no markdown, no code fences:
{
  "splitTasks": [
    {
      "title": "...",
      "steps": ["...", "..."],
      "stepDurations": [20, 30],
      "totalDurationMinutes": 50
    },
    {
      "title": "...",
      "steps": ["...", "..."],
      "stepDurations": [25, 40],
      "totalDurationMinutes": 65
    }
  ]
}`;

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a task splitting assistant. You ONLY return a raw JSON object. ' +
          'No markdown, no explanation, no refusals.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens:  800,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController:suggestSplit] Groq call failed:', err?.message || err);
    if (err?.isQuota)
      return res.status(429).json({ error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to split task. Please try again.',
    });
  }

  const rawText = data?.choices?.[0]?.message?.content || '';
  const stripped = rawText.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController:suggestSplit] JSON parse failed:', stripped.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse split tasks. Please try again.' });
  }

  if (!Array.isArray(parsed.splitTasks) || parsed.splitTasks.length === 0) {
    console.warn('[aiController:suggestSplit] No splitTasks in response');
    return res.status(500).json({ error: 'AI returned no split tasks. Please try again.' });
  }

  // Sanitise each split task
  const splitTasks = parsed.splitTasks
    .slice(0, 3)
    .map((t) => {
      const title = sanitiseTitle(typeof t.title === 'string' ? t.title : '') ?? task.trim();

      let taskSteps = [];
      if (Array.isArray(t.steps)) {
        taskSteps = t.steps
          .map(s => sanitiseStep(s))
          .filter(s => s && s.length > 2);
      }
      if (taskSteps.length === 0) return null;

      let durations = [];
      if (Array.isArray(t.stepDurations)) {
        durations = t.stepDurations
          .map(d => (typeof d === 'number' && d > 0) ? Math.max(2, Math.round(d)) : 5)
          .slice(0, taskSteps.length);
      }
      while (durations.length < taskSteps.length) durations.push(5);

      const computedTotal = durations.reduce((a, b) => a + b, 0);
      const total = (
        typeof t.totalDurationMinutes === 'number' && t.totalDurationMinutes > 0
      )
        ? Math.round(t.totalDurationMinutes)
        : computedTotal;

      return {
        title,
        steps: taskSteps,
        stepDurations: durations,
        totalDurationMinutes: total,
      };
    })
    .filter(Boolean);

  if (splitTasks.length === 0) {
    return res.status(500).json({ error: 'AI returned unusable split tasks. Please try again.' });
  }

  console.log(
    `[aiController:suggestSplit] ok | latency=${Date.now() - startTime}ms | ` +
    `"${task.slice(0, 60)}" → ${splitTasks.length} tasks`
  );

  return res.json({ splitTasks });
}

// ─── getDailyPlan ─────────────────────────────────────────────────────────────
// POST /api/ai/daily-plan
// Body: { tasks: Array<{ id, title, category, dueDate, status, sessionTime }>, availableMinutes: number }
// Returns: { orderedTaskIds: string[], reasoning: Record<string, string> }

export async function getDailyPlan(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { tasks, availableMinutes } = req.body || {};

  if (!Array.isArray(tasks) || tasks.length === 0)
    return res.status(400).json({ error: 'Missing or empty tasks array' });

  if (typeof availableMinutes !== 'number' || availableMinutes <= 0)
    return res.status(400).json({ error: 'Missing or invalid availableMinutes' });

  const dateCtx = buildDateContext();

  // Build a compact task list for the prompt
  const taskList = tasks
    .slice(0, 20) // cap at 20 to keep tokens reasonable
    .map((t, i) => {
      const due     = t.dueDate ? `due: ${t.dueDate}` : 'no due date';
      const session = t.sessionTime ? `${t.sessionTime}min logged` : 'not started';
      return `${i + 1}. [${t.id}] "${t.title}" | category: ${t.category} | ${due} | status: ${t.status} | ${session}`;
    })
    .join('\n');

  const prompt = `You are a daily productivity planner. Given a list of pending tasks and the user's available time today, suggest the best order to tackle them.

════════════════════════════════
DATE REFERENCE:
${dateCtx}
════════════════════════════════

Available time today : ${availableMinutes} minutes
Pending tasks:
${taskList}

Prioritisation rules:
- Tasks due today or overdue come first
- Tasks with earlier due dates rank higher than tasks with no due date
- Shorter tasks (quick wins) can be scheduled early to build momentum
- Already-started tasks (status: in-progress) rank above todo tasks of equal urgency
- Tasks with time already logged (sessionTime) suggest ongoing work — keep them high
- Do NOT include done tasks

Return ONLY a raw JSON object — no markdown, no code fences:
{
  "orderedTaskIds": ["id1", "id2", "id3"],
  "reasoning": {
    "id1": "One sentence explaining why this is first",
    "id2": "One sentence explaining why this is second",
    "id3": "One sentence explaining why this is third"
  }
}

Only include task IDs from the list above. reasoning must have one entry per id in orderedTaskIds.`;

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a daily planner assistant. You ONLY return a raw JSON object with ' +
          'orderedTaskIds and reasoning fields. No markdown, no explanation, no refusals.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens:  600,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController:getDailyPlan] Groq call failed:', err?.message || err);
    if (err?.isQuota)
      return res.status(429).json({ error: err.message });
    return res.status(500).json({
      error: err.message || 'Failed to generate daily plan. Please try again.',
    });
  }

  const rawText = data?.choices?.[0]?.message?.content || '';
  const stripped = rawText.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController:getDailyPlan] JSON parse failed:', stripped.slice(0, 200));
    return res.status(500).json({ error: 'Failed to parse daily plan. Please try again.' });
  }

  if (!Array.isArray(parsed.orderedTaskIds) || parsed.orderedTaskIds.length === 0) {
    console.warn('[aiController:getDailyPlan] No orderedTaskIds in response');
    return res.status(500).json({ error: 'AI returned no task order. Please try again.' });
  }

  // Validate all returned IDs exist in the input task list
  const validIds = new Set(tasks.map(t => t.id));
  const orderedTaskIds = parsed.orderedTaskIds.filter(id => validIds.has(id));

  if (orderedTaskIds.length === 0) {
    return res.status(500).json({ error: 'AI returned unrecognised task IDs. Please try again.' });
  }

  // Sanitise reasoning — ensure it's a plain string-to-string map
  const reasoning = {};
  if (parsed.reasoning && typeof parsed.reasoning === 'object') {
    for (const id of orderedTaskIds) {
      const r = parsed.reasoning[id];
      if (typeof r === 'string' && r.trim()) {
        reasoning[id] = r.trim();
      }
    }
  }

  console.log(
    `[aiController:getDailyPlan] ok | latency=${Date.now() - startTime}ms | ` +
    `${orderedTaskIds.length} tasks ordered`
  );

  return res.json({ orderedTaskIds, reasoning });
}