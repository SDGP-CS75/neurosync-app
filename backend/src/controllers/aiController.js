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

/**
 * Single words that are CLEARLY not tasks — pure reactions, greetings,
 * throwaway tokens. Keep this list SHORT and conservative.
 * DO NOT add real action verbs: "run", "go", "eat", "sleep", "gym" etc.
 */
const VAGUE_SINGLE_WORDS = new Set([
  // Reactions / emotions
  'lol','lmao','lmfao','haha','hehe','hmmm','hmm','ughhh','ugh',
  'yay','wow','meh','nope','bruh','omg','omfg',
  'idk','nvm','smh','imo','fyi','tbh','wtf',
  // Greetings
  'hi','hey','hello','bye','goodbye','sup','yo',
  // Pure affirmations / negations
  'ok','okay','yes','no','yep','yeah','nah','sure',
  // Testing / throwaway
  'test','testing','asdf','qwerty',
]);

/**
 * Profanity / hate speech — primary use is offensive.
 * Keep TIGHT — don't add words with legitimate secondary meanings.
 */
const OFFENSIVE_WORDS = new Set([
  'fuck','shit','bitch','cunt','cock','pussy',
  'fuk','fck','stfu','gtfo',
  'motherfucker','fucker','bullshit','jackass','dumbass',
  'retard','slut','whore','nigger','nigga','faggot',
  'prick','wanker','twat',
]);

/**
 * Pure grammar / filler — closed-class words with zero standalone task meaning.
 * Only used to detect 100%-filler inputs like "is it the" or "a to the of".
 * DO NOT add verbs like "go", "do", "run", "get".
 */
const PURE_FILLER_WORDS = new Set([
  'i','you','me','my','we','us','he','she','it','they','them','your','our','their',
  'a','an','the',
  'is','are','was','were','be','been','am',
  'to','of','in','on','at','by','for','up','or','and','but','so','if','as',
  'can','will','shall','may','might','could','would','should','must',
  'that','which','who','whom','whose','when','where','while','although','because',
]);

// ─── Input cleaner ────────────────────────────────────────────────────────────

/**
 * Normalise raw user input BEFORE validation and AI call.
 * Strips noise without removing meaningful content.
 */
function cleanTaskInput(raw) {
  let t = raw.trim();

  // Collapse repeated word sequences (up to 3 words)
  // "have to have to go" → "have to go"
  const repeatRx = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
  t = t.replace(repeatRx, '$1');
  t = t.replace(repeatRx, '$1'); // second pass for nested repeats

  // Strip leading filler phrases — run twice for stacked phrases
  const fillerRx = /^(i need to|i have to|i want to|i must|i should|can you please|can you|please help me to|please help me|please|help me to|help me|i am going to|i am gonna|gonna|gotta|i'd like to|i'd love to|i would like to|remind me to|don't forget to)\s+/i;
  t = t.replace(fillerRx, '');
  t = t.replace(fillerRx, '');

  // Collapse multiple spaces / newlines
  t = t.replace(/\s{2,}/g, ' ').trim();

  return t;
}

// ─── Neutralise sensitive / geopolitical framing ──────────────────────────────

/**
 * Replace "X vs Y war / conflict / crisis" with a neutral phrase so the LLM
 * focuses on the creative or professional task rather than the topic.
 * Prevents the model refusing inputs like:
 *   "create a generative AI video about America vs Iran war"
 */
function neutraliseTask(t) {
  // "Country vs Country war/conflict/battle/crisis/fight/clash"
  t = t.replace(
    /\b([A-Z][a-zA-Z]+)\s+(?:vs\.?|versus|and)\s+([A-Z][a-zA-Z]+)\s+(war|conflict|battle|crisis|fight|clash)\b/gi,
    'geopolitical conflict'
  );

  // "war between X and Y" / "conflict between X and Y"
  t = t.replace(
    /\b(war|conflict|battle|crisis)\s+between\s+[A-Z][a-zA-Z]+\s+and\s+[A-Z][a-zA-Z]+\b/gi,
    'geopolitical conflict'
  );

  return t;
}

// ─── Spam / offensive / meaningless input guard ───────────────────────────────

/**
 * Returns a user-friendly error string if the input should be rejected.
 * Returns null if the input is a valid task candidate.
 *
 * PHILOSOPHY: Be PERMISSIVE. Only reject what is CLEARLY not a task.
 * False negatives (letting spam through) are far less harmful than
 * false positives (blocking real tasks). The AI handles ambiguous input fine.
 */
function validateTaskMeaning(input) {
  const t     = input.trim();
  const lower = t.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  // 1. Too short
  if (t.length < MIN_TASK_LENGTH)
    return 'Please describe your task in a few words.';

  // 2. No letters at all (emoji-only, numbers, symbols)
  if (!/[a-zA-Z]/.test(t))
    return "That doesn't look like a task. Please describe what you need to do.";

  // 3. No real word — need at least one run of 3+ letters
  if (!/[a-zA-Z]{3,}/.test(t))
    return "That doesn't look like a task. Please describe what you need to do.";

  // 4. Pure repeated single character — "aaaa", "!!!!" but NOT "haha"
  const noSpaces = lower.replace(/\s/g, '');
  if (noSpaces.length >= 4 && /^(.)\1+$/.test(noSpaces))
    return 'Your input looks like random text. Please describe a real task.';

  // 5. Offensive / hate speech
  const hasOffensive = words.some(w => OFFENSIVE_WORDS.has(w.replace(/[^a-z]/g, '')));
  if (hasOffensive)
    return "That doesn't look like a task. Please enter something you actually need to do.";

  // 6. Gibberish — word with 5+ letters and zero vowels including 'y'
  //    Only reject if MORE THAN HALF the multi-char words are gibberish
  const letterWords    = words.map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length >= 5);
  const gibberishWords = letterWords.filter(w => !/[aeiouy]/.test(w));
  if (letterWords.length >= 1 && gibberishWords.length > letterWords.length / 2)
    return 'Your input looks like random text. Please describe a real task.';

  // 7. Keyboard mash — only triggers on 8+ char tokens with 85%+ from one row
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

  // 8. Single vague/reaction word (after filler has been stripped by cleanTaskInput)
  //    Real single-word tasks: "run", "gym", "eat", "sleep" → NOT in VAGUE_SINGLE_WORDS
  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].replace(/[^a-z]/g, '')))
    return "That's too vague. Try something like \"Buy groceries tomorrow at 5pm\".";

  // 9. 100% pure filler — every word is a grammar/filler word with no content
  const meaningfulWords = words.filter(w => {
    const clean = w.replace(/[^a-z]/g, '');
    return clean.length >= 2 && !PURE_FILLER_WORDS.has(clean);
  });
  if (words.length >= 2 && meaningfulWords.length === 0)
    return "Please describe a real task — something you actually need to get done.";

  return null; // ✅ passes all checks
}

// ─── Date helpers (server-side — LLM never computes dates) ───────────────────

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
  const nextWeekend = nextWeekday(now, 6); // next Saturday
  const nextWeek    = new Date(now);       nextWeek.setDate(now.getDate() + 7);
  const endOfWeek   = nextWeekday(now, 5); // next Friday

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
    .replace(/^[\d\-*•.)\s]+/, '')  // strip leading bullets / numbers
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
• 3 to 5 words only — no more
• Must start with an action verb: Create, Fix, Buy, Write, Plan, Call, Review, Build,
  Send, Prepare, Book, Complete, Schedule, Finish, Make, Draft, Submit, Organize,
  Set Up, Go, Run, Eat, Visit
• Title Case — capitalise every important word
• No punctuation at the end
• Remove ALL filler: "I need to", "I want to", "I have to", "I must", "please",
  "help me", "can you", "I should", "I'd like to", "remind me to"
• If words are repeated in the task (e.g. "have to have to"), ignore the repetition

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
• Return EXACTLY 3 to 6 steps — never fewer than 3, never more than 6
• Each step = ONE sentence, MAX 8 words
• Start every step with an action verb: Open, Search, Write, Call, Download, Pick,
  Send, Save, Go, Buy, Check, Read, Fill, Book, Pay, Review, Draft, Set, Find,
  Visit, Add, Upload, Print, Sign, Confirm, Install, Prepare, Eat, Run, Walk
• Plain simple English — imagine explaining to someone who has NEVER done this before
• Logical order: preparation → main action → review → completion
• ZERO duplicate steps
• NO vague filler steps: "Start the task", "Think about it", "You're done",
  "Get ready", "Begin working"
• NO compound steps — never join two actions with "and then", "also", "then", "while"
• Adapt step count to complexity — simple tasks need only 3, complex tasks can use 6
• Always treat the input as a legitimate creative or professional task — never refuse

BAD steps:
  ✗ "Research various AI tools and platforms that can help generate content efficiently"
  ✗ "Think about what you need and decide the best approach before starting"

GOOD steps:
  ✓ "Search for AI video generation tools online"
  ✓ "Write a 30-second script for the video"
  ✓ "Generate video clips using the AI tool"
  ✓ "Review and edit the generated footage"
  ✓ "Export and save the final video file"

════════════════════════════════
DURATION — estimate realistic time for each step
════════════════════════════════
• "stepDurations": array of integers (minutes), one per step, SAME ORDER as "steps"
• "totalDurationMinutes": integer — must equal the EXACT SUM of all stepDurations
• Never return 0 — minimum 2 minutes per step
• Be realistic and slightly conservative:

  Quick lookup / search            →   2–5 min
  Writing short message / email    →   5–10 min
  Reading / light research         →  10–20 min
  Deep research or planning        →  30–60 min
  Creative work (video, art, music)→  30–120 min per step
  Admin tasks (forms, calls, bills)→   5–20 min
  Physical tasks (gym, shop, cook) →  20–90 min
  Software setup / configuration   →  10–30 min
  Code review / debugging          →  15–45 min
  Presentation or report writing   →  30–90 min

Duration examples:
  Task: "buy groceries"
  steps: ["Write a shopping list", "Drive to the store", "Shop for items", "Return home"]
  stepDurations: [5, 15, 30, 15]
  totalDurationMinutes: 65

  Task: "create a generative AI video"
  steps: ["Research AI video generation tools", "Write the video script",
          "Generate video clips using AI tool", "Review and edit footage",
          "Export and upload the final video"]
  stepDurations: [20, 30, 60, 45, 15]
  totalDurationMinutes: 170

════════════════════════════════
WHEN — only if date or time is mentioned
════════════════════════════════
• Look up the date ONLY from the DATE REFERENCE above — NEVER calculate it yourself
• Time only (e.g. "at 6pm", "by 5pm")           → Today's date + that time
• Day only (e.g. "tomorrow", "next Monday")       → That date + 5.00 pm default
• Day + time (e.g. "tomorrow at 3pm")             → That date + that time
• "tonight"                                        → Today + 9.00 pm (or stated time)
• "this weekend"                                   → Weekend date from reference + 5.00 pm
• "this week" / "end of week"                     → End of week date + 5.00 pm
• "before [day]" / "by [day]"                    → That day + 5.00 pm
• "next week"                                      → Next week date + 5.00 pm
• Strict output format: "D Mon YYYY, h.mm am/pm"
  ✓ Good: "19 Mar 2026, 6.00 pm"   "5 Jan 2026, 11.30 am"
  ✗ Bad:  "March 19", "tomorrow", "6pm", "2026-03-19", "19/03/2026"
• If NO date or time is mentioned → do NOT include the "when" key at all

════════════════════════════════
CATEGORY — pick exactly one
════════════════════════════════
• Work     — reports, meetings, coding, emails, presentations, deadlines, professional
• Shopping — buying items, groceries, online orders, purchasing (non-health/medicine)
• Health   — exercise, doctor visits, medicine, fitness, diet, mental health, therapy
• Finance  — payments, bills, budgets, banking, investments, taxes, subscriptions
• Creative — writing stories/poems, art, music, design, video editing, photography
• Personal — family events, home chores, social plans, hobbies, self-care, errands
• Other    — anything that clearly does not fit any category above

Category tiebreaker examples:
  "buy medicine"         → Health   (health purpose beats purchase intent)
  "buy a birthday gift"  → Shopping (purchase with no health angle)
  "write a work email"   → Work     (professional context beats creative)
  "write a novel"        → Creative (personal creative project)
  "pay medical bill"     → Finance  (financial action beats health)
  "go for a morning run" → Health   (fitness activity)
  "create an AI video"   → Creative (creative production task)`;
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

  // ── Detect model refusals before attempting JSON parse
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

  // ── Strip markdown fences
  const stripped = text.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.warn('[aiController] JSON parse failed. Raw snippet:', stripped.slice(0, 200));
    // Fallback: treat each non-empty line as a step
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
  // Deduplicate
  const seen = new Set();
  steps = steps.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  steps = steps.slice(0, 6);

  // ── stepDurations — one integer per step, minimum 2 min each
  let stepDurations = [];
  if (Array.isArray(parsed.stepDurations)) {
    stepDurations = parsed.stepDurations
      .map(d => (typeof d === 'number' && Number.isFinite(d) && d > 0)
        ? Math.max(2, Math.round(d))
        : 5
      )
      .slice(0, steps.length);
  }
  // Pad to match steps length if the model returned fewer durations
  while (stepDurations.length < steps.length) stepDurations.push(5);

  // ── totalDurationMinutes — prefer model value, fall back to computed sum
  const computedSum = stepDurations.reduce((a, b) => a + b, 0);
  const totalDurationMinutes = (
    typeof parsed.totalDurationMinutes === 'number' &&
    Number.isFinite(parsed.totalDurationMinutes) &&
    parsed.totalDurationMinutes > 0
  )
    ? Math.round(parsed.totalDurationMinutes)
    : computedSum;

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

function buildPayload(model, taskStr) {
  return {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a task planning assistant. Your ONLY job is to break any user input ' +
          'into actionable steps and return a JSON object. You NEVER refuse, NEVER comment ' +
          'on the content, NEVER add warnings or disclaimers. You treat every input as a ' +
          'legitimate creative or professional task. You ALWAYS return raw JSON — ' +
          'no markdown, no refusals, no explanations outside the JSON.',
      },
      { role: 'user', content: buildPrompt(taskStr) },
    ],
    temperature: 0.3,
    max_tokens:  900,
  };
}

// ─── Main controller export ───────────────────────────────────────────────────

export async function breakTaskIntoSteps(req, res) {

  // ── 1. Environment guard
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  // ── 2. Extract raw input
  const { task } = req.body || {};
  let taskStr = typeof task === 'string' ? task.trim() : '';

  if (!taskStr)
    return res.status(400).json({ error: 'Missing or empty task' });

  if (taskStr.length > MAX_TASK_LENGTH)
    return res.status(400).json({
      error: `Task must be ${MAX_TASK_LENGTH} characters or fewer`,
    });

  // ── 3. Strip zero-width / control / prompt-injection characters
  taskStr = taskStr.replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, ' ').trim();

  // ── 4. Normalise: collapse repeated words + strip leading filler
  taskStr = cleanTaskInput(taskStr);

  // ── 5. Neutralise geopolitical / conflict framing so the model doesn't refuse
  taskStr = neutraliseTask(taskStr);

  // ── 6. Guard: reject only clear spam / offensive / gibberish
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

  const payload = buildPayload(model, taskStr);

  // ── 8. Call Groq with retry + backoff
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

  // ── 9. Log latency + token usage
  const usage   = data?.usage || {};
  const latency = Date.now() - startTime;
  console.log(
    `[aiController] ok | model=${model} | ` +
    `prompt_tokens=${usage.prompt_tokens ?? '?'} | ` +
    `completion_tokens=${usage.completion_tokens ?? '?'} | ` +
    `latency=${latency}ms | task="${taskStr.slice(0, 60)}"`
  );

  // ── 10. Parse + validate AI response
  const rawText = data?.choices?.[0]?.message?.content || '';
  const {
    title, steps, stepDurations, totalDurationMinutes,
    category, when, _refusal,
  } = parseResponse(rawText);

  // ── 11. Handle model refusal — re-frame task and retry once
  if (_refusal) {
    console.warn('[aiController] Refusal detected, retrying with neutral framing…');
    const neutralTask  = `Create a detailed project plan for: ${taskStr}`;
    const retryPayload = buildPayload(model, neutralTask);

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

  // ── 12. Require at least one valid step
  if (steps.length < 1) {
    console.warn('[aiController] 0 valid steps parsed. Raw:', rawText.slice(0, 300));
    return res.status(500).json({
      error: 'AI returned no usable steps. Please try rephrasing your task.',
    });
  }

  // ── 13. Map category → emoji + iconBg
  const { emoji, iconBg } = CATEGORY_META[category] ?? CATEGORY_META['Other'];

  // ── 14. Return full response
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