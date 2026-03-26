/**
 * AI controller — Task breakdown via Groq (OpenAI-compatible API).
 * Expects GROQ_API_KEY in env.
 *
 * Response shape:
 * {
 *   title:                string    — clean 3-5 word action title, Title Case
 *   steps:                string[]  — 3-6 short simple ordered sub-task strings
 *   stepDurations:        number[]  — realistic minutes per step (same order as steps)
 *   totalDurationMinutes: number    — exact sum of stepDurations
 *   category:             string    — Work | Personal | Shopping | Health | Finance | Creative | Other
 *   emoji:                string    — single relevant emoji
 *   iconBg:               string    — soft hex background colour matching category
 *   when?:                string    — "D Mon YYYY, h.mm am/pm" — only if input had a date/time
 * }
 */

import { getCalibrationContext } from '../services/aiCalibration.js';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Validation word lists ────────────────────────────────────────────────────
//
// PHILOSOPHY: Be as permissive as possible.
// Only block inputs that are UNAMBIGUOUSLY not a task.
// Abbreviations, brand names, foreign words, technical terms, slang task
// verbs — all should pass through to the AI.
// The AI handles ambiguity far better than regex ever will.

// Single-word inputs that have ZERO conceivable task meaning in any context.
// Keep this list SHORT and OBVIOUS. If in doubt, leave it out.
const VAGUE_SINGLE_WORDS = new Set([
  'lol','lmao','lmfao','rofl',
  'haha','hehe','hmmm','hmm','ugh',
  'yay','wow','meh','bruh',
  'omg','omfg','idk','nvm','smh','wtf',
  'hi','hey','hello','bye','goodbye','sup','yo',
  'ok','okay','yep','yeah',
  'asdf','qwerty',
]);

// Profanity / hate speech only. Keep TIGHT.
// Do NOT add words with common non-offensive meanings.
const OFFENSIVE_WORDS = new Set([
  'fuck','shit','bitch','cunt','cock','pussy',
  'fuk','fck','stfu','gtfo',
  'motherfucker','fucker','bullshit','jackass','dumbass',
  'retard','slut','whore','nigger','nigga','faggot',
  'prick','wanker','twat',
]);

// ─── Input cleaner ────────────────────────────────────────────────────────────

function cleanTaskInput(raw) {
  let t = raw.trim();

  // Collapse repeated word sequences: "have to have to go" → "have to go"
  const repeatRx = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
  t = t.replace(repeatRx, '$1');
  t = t.replace(repeatRx, '$1');

  // Strip leading filler phrases (run twice for stacked phrases)
  const fillerRx = /^(i need to|i have to|i want to|i must|i should|can you please|can you|please help me to|please help me|please|help me to|help me|i am going to|i am gonna|gonna|gotta|i'd like to|i'd love to|i would like to|remind me to|don't forget to)\s+/i;
  t = t.replace(fillerRx, '');
  t = t.replace(fillerRx, '');

  // Collapse extra whitespace
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

// ─── Spam / offensive guard ───────────────────────────────────────────────────
//
// Only 5 checks — all others removed to prevent false positives.
// Checks removed vs. previous version:
//   • Gibberish (vowel check) — blocked "gym", "sync", "MVP", brand names, non-English words
//   • Keyboard mash — blocked "write", "route", technical shortcuts
//   • All-filler check — blocked short-but-valid cleaned inputs like "run", "eat"
//
// If a check is causing a false positive, remove it. Let the AI decide.

function validateTaskMeaning(input) {
  const t     = input.trim();
  const lower = t.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  // ── 1. Too short (3 chars min — "run", "gym", "eat" all pass)
  if (t.length < MIN_TASK_LENGTH) {
    return 'Please describe your task in a few words.';
  }

  // ── 2. No letters at all (pure emoji, numbers, symbols)
  if (!/[a-zA-Z]/.test(t)) {
    return "That doesn't look like a task. Please describe what you need to do.";
  }

  // ── 3. No real word — need at least one run of 3+ letters
  //       Allows "go 5km" or "pay $50" to pass.
  if (!/[a-zA-Z]{3,}/.test(t)) {
    return "That doesn't look like a task. Please describe what you need to do.";
  }

  // ── 4. Pure repeated single character — "aaaa", "zzzzzz"
  //       Spaces removed first so "a a a a" also fails.
  //       "haha" passes (two different chars).
  const noSpaces = lower.replace(/\s/g, '');
  if (noSpaces.length >= 4 && /^(.)\1+$/.test(noSpaces)) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  // ── 5. Offensive / hate speech
  const hasOffensive = words.some(w => OFFENSIVE_WORDS.has(w.replace(/[^a-z]/g, '')));
  if (hasOffensive) {
    return "That doesn't look like a task. Please enter something you actually need to do.";
  }

  // ── 6. Single word that is purely a reaction with zero task meaning
  //       Single action words ("run", "eat", "gym", "sleep") are NOT in this list.
  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].replace(/[^a-z]/g, ''))) {
    return "That's too vague. Try something like \"Buy groceries tomorrow at 5pm\".";
  }

  return null; // ✅ passes — send to AI
}

// ─── Date helpers (server-side — LLM never computes dates) ───────────────────

const MONTHS        = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function fmtDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

// ─── Duration reference table ─────────────────────────────────────────────────
//
// Injected into the prompt so the model has real-world anchors.
// These are median realistic durations for common task types.

const DURATION_REFERENCE = `
DURATION REFERENCE — use these as anchors when estimating step durations:

Quick physical actions (2-5 min each):
  Boil water, make tea/coffee, pack a bag, send a short message, take a photo

Short focused tasks (5-15 min each):
  Write a short email, pay a bill online, book an appointment, quick grocery run
  Read a short article, fill out a form, make a phone call, water plants

Medium tasks (15-30 min each):
  Write a report section, cook a simple meal, clean one room, do laundry (active time)
  Attend a short meeting, write a blog post draft, respond to multiple emails

Longer tasks (30-60 min each):
  Write a full report, prepare a presentation, deep clean a room, cook a full meal
  Code a small feature, study a chapter, go to the gym, do a workout

Extended tasks (60-120 min each):
  Write a detailed document, build a small app feature, do a full grocery shop + put away
  Attend a long meeting, complete a study session, do a thorough review

Rules for estimating:
- Add realistic buffer: people are rarely at 100% focus
- Travel steps (go to store, drive to appointment) = 15-30 min minimum
- "Research" steps = 15-45 min depending on depth
- "Review and edit" = at least 10 min — never less than 5
- "Set up" or "prepare" steps = 5-20 min
- Minimum per step = 3 min (even the simplest steps take some time)
- Do NOT round everything to 5 or 10 — use realistic values like 3, 7, 12, 25, 45
- totalDurationMinutes MUST equal the EXACT sum of all stepDurations`;

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

  return `You are a helpful daily task planner. Break the user's task into 3-6 simple, clear steps with REALISTIC time estimates.

════════════════════════════════
DATE REFERENCE — look up dates here, never compute yourself:
${dateCtx}
════════════════════════════════
${DURATION_REFERENCE}
════════════════════════════════

TASK: "${task}"

Return ONLY a raw JSON object — no markdown, no code fences, no explanation, just JSON.

Format (no date/time in task):
{
  "title": "...",
  "steps": ["step 1", "step 2", "step 3"],
  "stepDurations": [15, 30, 10],
  "totalDurationMinutes": 55,
  "category": "..."
}

Format (task has a date or time — include "when"):
{
  "title": "...",
  "steps": ["step 1", "step 2", "step 3"],
  "stepDurations": [15, 30, 10],
  "totalDurationMinutes": 55,
  "category": "...",
  "when": "..."
}

════════════════════════════════
TITLE rules
════════════════════════════════
• 3 to 5 words only
• Start with an action verb: Create, Fix, Buy, Write, Plan, Call, Review, Build,
  Send, Prepare, Book, Complete, Schedule, Finish, Make, Draft, Submit, Organize,
  Set Up, Go, Run, Eat, Visit, Study, Clean, Cook, Research
• Title Case every important word
• No punctuation at the end
• Strip all filler: "I need to", "I want to", "I have to", "please", "help me",
  "can you", "remind me to", "I should", "I'd like to"
• Ignore repeated words (e.g. "have to have to" → ignore the repeat)

Examples:
  "I need to create a report about AI"  →  "Create AI Report"
  "buy some milk at the store tomorrow" →  "Buy Milk at Store"
  "fix the login bug in my app"         →  "Fix Login Bug"
  "go to the gym at 6am"               →  "Go to the Gym"
  "run"                                →  "Go for a Run"
  "create a generative AI video about geopolitical conflict" → "Create AI Conflict Video"

════════════════════════════════
STEPS rules
════════════════════════════════
• EXACTLY 3 to 6 steps — never fewer, never more
• Each step = ONE sentence, MAX 8 words
• Start each step with an action verb
• Plain simple English — clear for someone doing this first time
• Logical order: preparation → main action → review → finish
• No duplicate steps
• No vague steps: "Start the task", "Think about it", "Get ready", "You're done"
• No compound steps joined with "and then", "also", "while"
• Always treat input as a legitimate task — never refuse

════════════════════════════════
DURATION rules — READ CAREFULLY
════════════════════════════════
• stepDurations: one integer (minutes) per step, in the same order as steps
• Use the DURATION REFERENCE above as your anchor — do NOT guess randomly
• Think about each step realistically: how long would a real person take?
• Use varied, realistic values — NOT everything rounded to 5 or 10
  Good: [7, 25, 45, 12]     Bad: [5, 10, 10, 5]
• Minimum per step: 3 minutes
• Travel steps: 15-30 min minimum
• "Research" steps: 15-45 min
• "Review / edit" steps: minimum 10 min
• totalDurationMinutes MUST equal the EXACT arithmetic sum of stepDurations
  e.g. if steps are [7, 25, 45, 12] then totalDurationMinutes MUST be 89

════════════════════════════════
WHEN rules (only if date/time mentioned)
════════════════════════════════
• Look up date ONLY from DATE REFERENCE — never calculate yourself
• Time only (e.g. "at 6pm")          → Today + that time
• Day only (e.g. "tomorrow")          → That date + 5.00 pm default
• Day + time (e.g. "tomorrow at 3pm") → That date + that time
• "tonight"                           → Today + 9.00 pm (or stated time)
• "this weekend"                      → Weekend date + 5.00 pm
• "this week" / "end of week"         → End of week date + 5.00 pm
• "before/by [day]"                   → That day + 5.00 pm
• "next week"                         → Next week date + 5.00 pm
• Strict format: "D Mon YYYY, h.mm am/pm"
  ✓ "22 Mar 2026, 6.00 pm"   ✓ "5 Jan 2026, 11.30 am"
  ✗ "March 22"   ✗ "tomorrow"   ✗ "6pm"   ✗ "2026-03-22"
• No date/time at all → do NOT include "when" key

════════════════════════════════
CATEGORY rules
════════════════════════════════
Pick exactly one:
• Work     — reports, meetings, coding, emails, presentations, professional tasks
• Shopping — buying items, groceries, orders (not medicine/health)
• Health   — exercise, doctor, medicine, fitness, diet, mental health, therapy
• Finance  — payments, bills, budgets, banking, investments, taxes
• Creative — art, writing stories/poems, music, design, video, photography
• Personal — family, home, social plans, hobbies, self-care, errands
• Other    — does not clearly fit any above

Tiebreakers:
  "buy medicine"         → Health   (health intent wins)
  "buy a birthday gift"  → Shopping (no health angle)
  "write a work email"   → Work     (professional wins)
  "write a poem"         → Creative
  "pay medical bill"     → Finance  (financial action wins)
  "go for a morning run" → Health   (fitness)`;
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

  // Detect model refusals before trying to parse JSON
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

  // ── title
  const title = sanitiseTitle(typeof parsed.title === 'string' ? parsed.title : '');

  // ── steps
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

  // ── stepDurations — validate each value, pad/trim to match step count
  let stepDurations = [];
  if (Array.isArray(parsed.stepDurations)) {
    stepDurations = parsed.stepDurations
      .map(d => {
        if (typeof d !== 'number' || !Number.isFinite(d) || d <= 0) return 5;
        return Math.max(3, Math.round(d));   // minimum 3 min per step
      })
      .slice(0, steps.length);
  }
  // Pad with 5 if model returned fewer durations than steps
  while (stepDurations.length < steps.length) stepDurations.push(5);

  // ── totalDurationMinutes — always recompute from stepDurations for accuracy
  //    The model is bad at arithmetic. Ignore what it returned, sum ourselves.
  const totalDurationMinutes = stepDurations.reduce((a, b) => a + b, 0);

  // ── category
  const validCategories = Object.keys(CATEGORY_META);
  const rawCat   = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  const category = validCategories.includes(rawCat) ? rawCat : 'Other';

  // ── when — strict format: "D Mon YYYY, h.mm am/pm"
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
    'into actionable steps with REALISTIC time estimates, and return a JSON object. ' +
    'You NEVER refuse, NEVER comment on content, NEVER add warnings or disclaimers. ' +
    'Treat every input as a legitimate creative or professional task. ' +
    'ALWAYS return raw JSON — no markdown, no refusals, no explanations outside the JSON.';

  if (userId) {
    try {
      const calibration = await getCalibrationContext(userId);
      if (calibration) systemPrompt += '\n\n' + calibration;
    } catch (_) {
      // calibration is optional — never let it break the main flow
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

// ─── Main controller ──────────────────────────────────────────────────────────

export async function breakTaskIntoSteps(req, res) {

  // ── 1. Env guard
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  // ── 2. Extract + basic validate input
  const { task, userId } = req.body || {};
  let taskStr = typeof task === 'string' ? task.trim() : '';

  if (!taskStr)
    return res.status(400).json({ error: 'Missing or empty task' });

  if (taskStr.length > MAX_TASK_LENGTH)
    return res.status(400).json({ error: `Task must be ${MAX_TASK_LENGTH} characters or fewer` });

  // ── 3. Strip zero-width / control / prompt-injection chars
  taskStr = taskStr.replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, ' ').trim();

  // ── 4. Clean: collapse repeated words, strip leading filler
  taskStr = cleanTaskInput(taskStr);

  // ── 5. Neutralise geopolitical framing so the model doesn't refuse
  taskStr = neutraliseTask(taskStr);

  // ── 6. Spam / offensive guard (6 checks only — see function for rationale)
  const meaningError = validateTaskMeaning(taskStr);
  if (meaningError) {
    console.log(`[aiController] 422 rejected: "${taskStr}" → ${meaningError}`);
    return res.status(422).json({ error: meaningError });
  }

  // ── 7. Resolve model
  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = await buildPayload(model, taskStr, userId ?? null);

  // ── 8. Call Groq
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

  // ── 9. Log
  const usage   = data?.usage || {};
  const latency = Date.now() - startTime;
  console.log(
    `[aiController] ok | model=${model} | ` +
    `prompt_tokens=${usage.prompt_tokens ?? '?'} | ` +
    `completion_tokens=${usage.completion_tokens ?? '?'} | ` +
    `latency=${latency}ms | task="${taskStr.slice(0, 60)}"`
  );

  // ── 10. Parse
  const rawText = data?.choices?.[0]?.message?.content || '';
  const { title, steps, stepDurations, totalDurationMinutes, category, when, _refusal } =
    parseResponse(rawText);

  // ── 11. Handle refusal — retry with neutral framing
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
      error: "Try rephrasing your task — e.g. 'Plan an AI conflict video project'",
    });
  }

  // ── 12. Guard: no usable steps
  if (steps.length < 1) {
    console.warn('[aiController] 0 valid steps parsed. Raw:', rawText.slice(0, 300));
    return res.status(500).json({
      error: 'AI returned no usable steps. Please try rephrasing your task.',
    });
  }

  // ── 13. Derive emoji + iconBg
  const { emoji, iconBg } = CATEGORY_META[category] ?? CATEGORY_META['Other'];

  return res.json({
    title: title ?? taskStr,
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
DATE REFERENCE — look up dates here, NEVER compute yourself:
${dateCtx}
════════════════════════════════

Current due date : "${currentDueDate.trim()}"
User instruction : "${instruction.trim()}"

Return ONLY a raw JSON object — no markdown, no code fences:
{ "newDueDate": "D Mon YYYY, h.mm am/pm" }

Rules:
- Look up the target date from the DATE REFERENCE above
- Strict format: "D Mon YYYY, h.mm am/pm"   e.g. "23 Mar 2026, 5.00 pm"
- Day change only (e.g. "move to next Monday") → keep original time
- Time change only (e.g. "push to 3pm") → keep original date
- Both changed → apply both
- Ambiguous → default to 5.00 pm`;

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a date parsing assistant. Return ONLY a raw JSON object with a newDueDate field. No markdown, no explanation, no refusals.',
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
    console.error('[aiController:reschedule] Groq failed:', err?.message || err);
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

  const whenRx    = /^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}\.\d{2} (am|pm)$/;
  const newDueDate = typeof parsed.newDueDate === 'string' ? parsed.newDueDate.trim() : '';

  if (!whenRx.test(newDueDate)) {
    console.warn('[aiController:reschedule] Invalid date format:', newDueDate);
    return res.status(500).json({ error: 'AI returned an invalid date format. Please try again.' });
  }

  console.log(`[aiController:reschedule] ok | latency=${Date.now() - startTime}ms | "${instruction}" → "${newDueDate}"`);
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

  const prompt = `You are a task planning assistant. A task is too long to complete in one session and must be split into 2-3 smaller tasks, each under 90 minutes.

${DURATION_REFERENCE}

Original task : "${task.trim()}"
Total duration: ${totalDurationMinutes} minutes
Current steps :
${stepsText}

Split this into 2 or 3 smaller focused tasks. Each smaller task must:
- Be completable in under 90 minutes
- Have a clear title (3-5 words, Title Case, starts with action verb)
- Have 2-4 steps (each max 8 words, starts with action verb)
- Have realistic stepDurations (min 3 per step, use the DURATION REFERENCE above)
- Have totalDurationMinutes = exact sum of its stepDurations
- Together cover all the work of the original

Return ONLY a raw JSON object:
{
  "splitTasks": [
    {
      "title": "...",
      "steps": ["...", "..."],
      "stepDurations": [20, 30],
      "totalDurationMinutes": 50
    }
  ]
}`;

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are a task splitting assistant. Return ONLY raw JSON. No markdown, no explanation, no refusals.' },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.3,
    max_tokens:  800,
  };

  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController:suggestSplit] Groq failed:', err?.message || err);
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

  if (!Array.isArray(parsed.splitTasks) || parsed.splitTasks.length === 0) {
    return res.status(500).json({ error: 'AI returned no split tasks. Please try again.' });
  }

  const splitTasks = parsed.splitTasks
    .slice(0, 3)
    .map((t) => {
      const title = sanitiseTitle(typeof t.title === 'string' ? t.title : '') ?? task.trim();

      let taskSteps = [];
      if (Array.isArray(t.steps)) {
        taskSteps = t.steps.map(s => sanitiseStep(s)).filter(s => s && s.length > 2);
      }
      if (taskSteps.length === 0) return null;

      let durations = [];
      if (Array.isArray(t.stepDurations)) {
        durations = t.stepDurations
          .map(d => (typeof d === 'number' && d > 0) ? Math.max(3, Math.round(d)) : 5)
          .slice(0, taskSteps.length);
      }
      while (durations.length < taskSteps.length) durations.push(5);

      // Always recompute total — never trust the model's arithmetic
      const total = durations.reduce((a, b) => a + b, 0);

      return { title, steps: taskSteps, stepDurations: durations, totalDurationMinutes: total };
    })
    .filter(Boolean);

  if (splitTasks.length === 0)
    return res.status(500).json({ error: 'AI returned unusable split tasks. Please try again.' });

  console.log(`[aiController:suggestSplit] ok | latency=${Date.now() - startTime}ms | "${task.slice(0, 60)}" → ${splitTasks.length} tasks`);
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

  const dateCtx  = buildDateContext();
  const taskList = tasks
    .slice(0, 20)
    .map((t, i) => {
      const due     = t.dueDate     ? `due: ${t.dueDate}`          : 'no due date';
      const session = t.sessionTime ? `${t.sessionTime}min logged`  : 'not started';
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
- Tasks with time already logged → keep high (ongoing work)
- Shorter tasks early → build momentum
- Do NOT include done tasks

Return ONLY a raw JSON object:
{
  "orderedTaskIds": ["id1", "id2", "id3"],
  "reasoning": {
    "id1": "One sentence why this is first",
    "id2": "One sentence why this is second"
  }
}

Only use IDs from the list above. reasoning must have one entry per orderedTaskId.`;

  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : 'llama-3.1-8b-instant';

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
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController:getDailyPlan] Groq failed:', err?.message || err);
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

  const reasoning = {};
  if (parsed.reasoning && typeof parsed.reasoning === 'object') {
    for (const id of orderedTaskIds) {
      const r = parsed.reasoning[id];
      if (typeof r === 'string' && r.trim()) reasoning[id] = r.trim();
    }
  }

  console.log(`[aiController:getDailyPlan] ok | latency=${Date.now() - startTime}ms | ${orderedTaskIds.length} tasks ordered`);
  return res.json({ orderedTaskIds, reasoning });
}