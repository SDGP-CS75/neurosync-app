/**
 * AI controller — Task breakdown via Groq (OpenAI-compatible API).
 * Expects GROQ_API_KEY in env.
 *
 * Response shape:
 * {
 *   title:    string    — clean 3-5 word action title, Title Case
 *   steps:    string[]  — 3-6 short simple ordered sub-task strings
 *   category: string    — Work | Personal | Shopping | Health | Finance | Creative | Other
 *   emoji:    string    — single relevant emoji
 *   iconBg:   string    — soft hex background colour matching category
 *   when?:    string    — "D Mon YYYY, h.mm am/pm" — only present if input had a date/time
 * }
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const GROQ_URL        = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TASK_LENGTH = 500;
const MIN_TASK_LENGTH = 3;   // lowered: "run", "gym", "eat" are valid single-word tasks
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
// Rule: be CONSERVATIVE — only block what is clearly not a task.
// When in doubt, let the AI handle it rather than over-reject.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Only reject a single word if it is BOTH:
 *  (a) clearly not a task verb or noun on its own, AND
 *  (b) has no conceivable task interpretation
 *
 * DO NOT add words like "run", "go", "get", "try", "stop", "wait", "come",
 * "look", "see" — these are all legitimate single-word tasks after filler is stripped.
 */
const VAGUE_SINGLE_WORDS = new Set([
  // Pure reactions / emotions with no task meaning
  'lol','lmao','lmfao','haha','hehe','hmmm','hmm','ughhh','ugh',
  'yay','wow','meh','nah','nope','bruh','omg','omfg',
  'idk','nvm','smh','imo','fyi','tbh','wtf',
  // Greetings with no task meaning
  'hi','hey','hello','bye','goodbye','sup','yo',
  // Pure affirmations / negations with no task meaning
  'ok','okay','yes','no','yep','yeah','nah','sure',
  // Testing / throwaway
  'test','testing','asdf','qwerty',
]);

/**
 * Profanity / hate speech — reject immediately.
 *
 * Keep this TIGHT — do NOT add common words that happen to have a rude
 * secondary meaning. Only add words whose PRIMARY use is as an offensive slur
 * or whose only normal use is as profanity.
 *
 * Removed from previous version: "bloody", "hell", "crap", "damn", "ass"
 * (too many false positives — "blood pressure check", "hell's kitchen", etc.)
 */
const OFFENSIVE_WORDS = new Set([
  'fuck','shit','bitch','cunt','cock','pussy',
  'fuk','fck','stfu','gtfo',
  'motherfucker','fucker','bullshit','jackass','dumbass',
  'retard','slut','whore','nigger','nigga','faggot',
  'prick','wanker','twat',
]);

/**
 * Words that are ONLY filler/grammar with ZERO standalone task meaning.
 * Used to detect inputs that are 100% filler with nothing meaningful at all.
 *
 * IMPORTANT: Only add closed-class words (articles, prepositions, auxiliaries,
 * pure pronouns). Do NOT add verbs like "go", "do", "run", "get" — they are
 * meaningful task verbs on their own.
 */
const PURE_FILLER_WORDS = new Set([
  // Pronouns
  'i','you','me','my','we','us','he','she','it','they','them','your','our','their',
  // Articles
  'a','an','the',
  // Pure linking verbs (not action verbs)
  'is','are','was','were','be','been','am',
  // Prepositions
  'to','of','in','on','at','by','for','up','or','and','but','so','if','as',
  // Pure modal/auxiliary verbs — only when they appear alone with no content word
  'can','will','shall','may','might','could','would','should','must',
  // Conjunctions
  'that','which','who','whom','whose','when','where','while','although','because',
]);

// ─── Input cleaner ────────────────────────────────────────────────────────────

/**
 * Normalise raw user input BEFORE validation and AI call.
 * Strips noise without removing meaningful content.
 */
function cleanTaskInput(raw) {
  let t = raw.trim();

  // Collapse repeated word sequences up to 3 words long
  // "have to have to go" → "have to go"
  const repeatRx = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
  t = t.replace(repeatRx, '$1');
  t = t.replace(repeatRx, '$1'); // second pass for nested repeats

  // Strip leading filler phrases — run twice for stacked phrases
  // "please help me to buy milk" → "buy milk"
  const fillerRx = /^(i need to|i have to|i want to|i must|i should|can you please|can you|please help me to|please help me|please|help me to|help me|i am going to|i am gonna|gonna|gotta|i'd like to|i'd love to|i would like to|remind me to|don't forget to)\s+/i;
  t = t.replace(fillerRx, '');
  t = t.replace(fillerRx, '');

  // Collapse multiple spaces / newlines
  t = t.replace(/\s{2,}/g, ' ').trim();

  return t;
}

// ─── Spam / offensive / meaningless input guard ───────────────────────────────

/**
 * Returns a user-friendly error string if the input should be rejected.
 * Returns null if the input is a valid task candidate.
 *
 * PHILOSOPHY: Be permissive. Only reject what is CLEARLY not a task.
 * False negatives (letting spam through) are far less harmful than
 * false positives (blocking real tasks). The AI will handle ambiguous input fine.
 *
 * Check order:
 *  1. Too short (< 3 chars)
 *  2. No letters at all (pure numbers / symbols / emoji)
 *  3. No real word (no 3+ letter sequence)
 *  4. Pure repeated single character  ("aaaa", "!!!!")
 *  5. Offensive / hate speech word detected
 *  6. Gibberish — words with 5+ consonants and zero vowels (incl. y)
 *  7. Keyboard row mash (only for long tokens, very strict threshold)
 *  8. Single word that is in the vague-only list
 *  9. Every single word is a pure filler/grammar word (very rare edge case)
 */
function validateTaskMeaning(input) {
  const t     = input.trim();
  const lower = t.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  // ── 1. Too short
  if (t.length < MIN_TASK_LENGTH) {
    return 'Please describe your task in a few words.';
  }

  // ── 2. No letters at all (emoji-only, numbers, symbols)
  if (!/[a-zA-Z]/.test(t)) {
    return "That doesn't look like a task. Please describe what you need to do.";
  }

  // ── 3. No real word — need at least one run of 3+ letters
  if (!/[a-zA-Z]{3,}/.test(t)) {
    return "That doesn't look like a task. Please describe what you need to do.";
  }

  // ── 4. Pure repeated single character (strip spaces first)
  //       "aaaa", "!!!!", "zzzzzz" — but NOT "haha" (two different chars)
  const noSpaces = lower.replace(/\s/g, '');
  if (noSpaces.length >= 4 && /^(.)\1+$/.test(noSpaces)) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  // ── 5. Offensive / hate speech
  const hasOffensive = words.some(w => OFFENSIVE_WORDS.has(w.replace(/[^a-z]/g, '')));
  if (hasOffensive) {
    return "That doesn't look like a task. Please enter something you actually need to do.";
  }

  // ── 6. Gibberish detection
  //       A word is gibberish if it has 5+ letters AND zero vowels including 'y'.
  //       Raised from 4 to 5 chars, and added 'y' as vowel to fix false positives:
  //       "gym", "dry", "fly", "myth", "sync", "try", "cry" all pass now.
  const letterWords    = words.map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length >= 5);
  const gibberishWords = letterWords.filter(w => !/[aeiouy]/.test(w));
  // Only reject if MORE THAN HALF the multi-char words are gibberish
  // AND there are at least 1 such word (avoids divide-by-zero edge cases)
  if (letterWords.length >= 1 && gibberishWords.length > letterWords.length / 2) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  // ── 7. Keyboard mash — extremely strict to avoid false positives
  //       Only triggers on tokens that are 8+ chars with 85%+ from one row.
  //       Previous 70% threshold was causing "write", "route", "type" etc. to fail.
  const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const hasMash = words.some(w => {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length < 8) return false; // only flag very long suspicious tokens
    return KEYBOARD_ROWS.some(row => {
      const inRow = [...clean].filter(c => row.includes(c)).length;
      return inRow / clean.length >= 0.85; // raised from 0.70 to 0.85
    });
  });
  if (hasMash) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  // ── 8. Single vague/reaction word (only after filler has been stripped by cleanTaskInput)
  //       Note: single action words like "run", "gym", "eat", "sleep" are NOT in
  //       VAGUE_SINGLE_WORDS and correctly pass through to the AI.
  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].replace(/[^a-z]/g, ''))) {
    return "That's too vague. Try something like \"Buy groceries tomorrow at 5pm\".";
  }

  // ── 9. 100% pure filler — every word is a grammar/filler word with no content
  //       This is very rare after cleanTaskInput strips leading filler.
  //       Only fires for inputs like "is it the" / "a to the of" etc.
  const meaningfulWords = words.filter(w => {
    const clean = w.replace(/[^a-z]/g, '');
    return clean.length >= 2 && !PURE_FILLER_WORDS.has(clean);
  });
  if (words.length >= 2 && meaningfulWords.length === 0) {
    return "Please describe a real task — something you actually need to get done.";
  }

  return null; // ✅ passes all checks — send to AI
}

// ─── Date helpers (server-side — LLM never computes dates) ───────────────────

const MONTHS       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/** Format a Date as "D Mon YYYY" */
function fmtDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Next strict-future occurrence of a weekday (0=Sun … 6=Sat). */
function nextWeekday(now, targetDow) {
  const d    = new Date(now);
  const diff = ((targetDow - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Build a date lookup table injected into the prompt. */
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
    .map((word, i) => (i === 0 || !LOWERCASE_TITLE_WORDS.has(word))
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
  let s = raw.trim().replace(/^[\d\-*•.)\s]+/, '').replace(/\s{2,}/g, ' ').trim();
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
  "category": "..."
}

If the task HAS a date or time → include "when":
{
  "title": "...",
  "steps": ["...", "..."],
  "category": "...",
  "when": "..."
}

════════════════════════════════
TITLE rules
════════════════════════════════
• 3 to 5 words only — no more
• Must start with an action verb: Create, Fix, Buy, Write, Plan, Call, Review, Build, Send, Prepare, Book, Complete, Schedule, Finish, Make, Draft, Submit, Organize, Set Up, Go, Run, Eat, Visit
• Title Case — capitalise every important word
• No punctuation at the end
• Remove ALL filler: "I need to", "I want to", "I have to", "I must", "please", "help me", "can you", "I should", "I'd like to", "remind me to"
• If words are repeated in the task (e.g. "have to have to"), ignore the repetition

Good title examples:
  "I need to create a report about AI"  →  "Create AI Report"
  "buy some milk at the store tomorrow" →  "Buy Milk at Store"
  "fix the login bug in my app"         →  "Fix Login Bug"
  "write a birthday song for mom"       →  "Write Birthday Song"
  "go to the gym at 6am"               →  "Go to the Gym"
  "run"                                →  "Go for a Run"
  "eat"                                →  "Plan a Meal"

════════════════════════════════
STEPS — read every rule carefully
════════════════════════════════
• Return EXACTLY 3 to 6 steps — never fewer than 3, never more than 6
• Each step = ONE sentence, MAX 8 words
• Start every step with an action verb: Open, Search, Write, Call, Download, Pick, Send, Save, Go, Buy, Check, Read, Fill, Book, Pay, Review, Draft, Set, Find, Visit, Add, Upload, Print, Sign, Confirm, Install, Prepare, Eat, Run, Walk
• Plain simple English — imagine explaining to someone who has NEVER done this before
• Logical order: preparation → main action → review → completion
• ZERO duplicate steps
• NO vague filler steps: "Start the task", "Think about it", "You're done", "Get ready", "Begin working"
• NO compound steps — never join two actions with "and then", "also", "then", "while"
• Adapt step count to complexity — simple tasks need only 3, complex tasks can use up to 6

BAD steps:
  ✗ "Research various AI tools and platforms that can help generate content efficiently"
  ✗ "Think about what you need and decide the best approach before starting"

GOOD steps:
  ✓ "Search for AI report writing tools"
  ✓ "Outline the main sections of the report"
  ✓ "Write one section at a time"
  ✓ "Review the report for errors"
  ✓ "Save and share the final report"

════════════════════════════════
WHEN — only if date or time is mentioned
════════════════════════════════
• Look up the date ONLY from the DATE REFERENCE above — never calculate it yourself
• Time only (e.g. "at 6pm", "by 5pm")          → Today's date + that time
• Day only (e.g. "tomorrow", "next Monday")      → That date + 5.00 pm default
• Day + time (e.g. "tomorrow at 3pm")            → That date + that time
• "tonight"                                       → Today + 9.00 pm (or stated time)
• "this weekend"                                  → Weekend date from reference + 5.00 pm
• "this week" / "end of week"                    → End of week date + 5.00 pm
• "before [day]" / "by [day]"                   → That day's date + 5.00 pm
• "next week"                                     → Next week date + 5.00 pm
• Strict output format: "D Mon YYYY, h.mm am/pm"
  Good: "19 Mar 2026, 6.00 pm"   "5 Jan 2026, 11.30 am"
  Bad:  "March 19", "tomorrow", "6pm", "2026-03-19"
• If NO date or time is mentioned → do NOT include the "when" key at all

════════════════════════════════
CATEGORY — pick exactly one
════════════════════════════════
• Work     — reports, meetings, coding, emails, presentations, deadlines, professional tasks
• Shopping — buying items, groceries, online orders, purchasing (non-health/non-medicine)
• Health   — exercise, doctor visits, medicine, fitness routines, diet, mental health, therapy
• Finance  — payments, bills, budgets, banking, investments, taxes, subscriptions
• Creative — writing stories/poems, art, music, design, video editing, photography, crafts
• Personal — family events, home chores, social plans, hobbies, self-care, general errands
• Other    — anything that clearly does not fit any category above

Category tiebreaker examples:
  "buy medicine"         → Health   (health purpose beats purchase intent)
  "buy a birthday gift"  → Shopping (purchase with no health angle)
  "write a work email"   → Work     (professional context beats creative)
  "write a novel"        → Creative (personal creative project)
  "pay medical bill"     → Finance  (financial action beats health)
  "go for a morning run" → Health   (fitness activity)`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseResponse(text) {
  const empty = { title: null, steps: [], category: 'Other', when: null };
  if (!text || typeof text !== 'string') return empty;

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

  return { title, steps, category, when };
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

        if (/quota|exceeded|rate.?limit/i.test(rawStr)) {
          throw { isQuota: true, message: 'AI quota exceeded. Try again later.' };
        }
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

// ─── Main controller export ───────────────────────────────────────────────────

export async function breakTaskIntoSteps(req, res) {

  // ── 1. Environment guard
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  // ── 2. Extract raw input
  const { task } = req.body || {};
  let taskStr = typeof task === 'string' ? task.trim() : '';

  if (!taskStr) {
    return res.status(400).json({ error: 'Missing or empty task' });
  }
  if (taskStr.length > MAX_TASK_LENGTH) {
    return res.status(400).json({
      error: `Task must be ${MAX_TASK_LENGTH} characters or fewer`,
    });
  }

  // ── 3. Strip zero-width / control / prompt-injection characters
  taskStr = taskStr.replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, ' ').trim();

  // ── 4. Normalise: collapse repeated words, strip leading filler phrases
  taskStr = cleanTaskInput(taskStr);

  // ── 5. Guard: reject only clear spam / offensive / gibberish
  //       Log what we rejected so you can tune the checks during development
  const meaningError = validateTaskMeaning(taskStr);
  if (meaningError) {
    console.log(`[aiController] 422 rejected: "${taskStr}" → ${meaningError}`);
    return res.status(422).json({ error: meaningError });
  }

  // ── 6. Resolve model
  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages:    [{ role: 'user', content: buildPrompt(taskStr) }],
    temperature: 0.3,
    max_tokens:  700,
  };

  // ── 7. Call Groq with retry + backoff
  const startTime = Date.now();
  let data;
  try {
    data = await callGroqWithRetry(payload, apiKey);
  } catch (err) {
    console.error('[aiController] Groq call failed:', err?.message || err);
    if (err?.isQuota) {
      return res.status(429).json({ error: err.message });
    }
    return res.status(500).json({
      error: err.message || 'Failed to break task into steps. Please try again.',
    });
  }

  // ── 8. Log latency + token usage
  const usage   = data?.usage || {};
  const latency = Date.now() - startTime;
  console.log(
    `[aiController] ok | model=${model} | ` +
    `prompt_tokens=${usage.prompt_tokens ?? '?'} | ` +
    `completion_tokens=${usage.completion_tokens ?? '?'} | ` +
    `latency=${latency}ms | task="${taskStr.slice(0, 60)}"`
  );

  // ── 9. Parse + validate AI response
  const rawText = data?.choices?.[0]?.message?.content || '';
  const { title, steps, category, when } = parseResponse(rawText);

  if (steps.length < 1) {
    console.warn('[aiController] 0 valid steps parsed. Raw:', rawText.slice(0, 300));
    return res.status(500).json({
      error: 'AI returned no usable steps. Please try rephrasing your task.',
    });
  }

  // ── 10. Map category → emoji + iconBg
  const { emoji, iconBg } = CATEGORY_META[category] ?? CATEGORY_META['Other'];

  // ── 11. Return response
  return res.json({
    title:    title ?? taskStr,
    steps,
    category,
    emoji,
    iconBg,
    ...(when ? { when } : {}),
  });
}