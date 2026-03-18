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
const MIN_TASK_LENGTH = 5;
const REQUEST_TIMEOUT = 12_000;  // 12 s
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

// Single-word inputs that carry no task intent on their own
const VAGUE_SINGLE_WORDS = new Set([
  'lol','lmao','ok','okay','yes','no','hi','hey','hello','bye','goodbye',
  'test','fire','go','do','yay','wow','hmm','ugh','meh','nah','nope',
  'haha','hehe','bruh','omg','idk','nvm','sure','cool','nice','run',
  'great','fine','done','stop','wait','try','see','get','come','look',
  'what','why','how','who','when','where','which','that','this','just',
]);

// Profanity / offensive words — reject immediately, never send to Groq
const OFFENSIVE_WORDS = new Set([
  'fuck','shit','bitch','asshole','bastard','cunt','dick','cock',
  'pussy','piss','crap','ass','fuk','fck','stfu','gtfo',
  'motherfucker','fucker','bullshit','jackass','dumbass','idiot',
  'stupid','moron','retard','slut','whore','nigger','faggot','prick',
  'wanker','twat','arse','bollocks','tosser','bloody','hell',
]);

// Words that have zero task meaning — used to detect "all filler" inputs
const NON_TASK_FILLER = new Set([
  'i','you','me','my','we','us','he','she','it','they','them','your',
  'a','an','the','is','are','was','were','be','been','am',
  'to','of','in','on','at','by','for','up','or','and','but','so','if',
  'do','did','does','can','will','shall','may','might','could','would','should',
]);

// ─── Input cleaner ────────────────────────────────────────────────────────────

/**
 * Normalise raw user input before validation and AI call:
 *  • Collapse consecutive duplicate word sequences  ("have to have to" → "have to")
 *  • Strip common leading filler phrases            ("i need to buy milk" → "buy milk")
 *  • Collapse extra whitespace / newlines
 */
function cleanTaskInput(raw) {
  let t = raw.trim();

  // Collapse repeated word sequences up to 3 words long (run twice for nested repeats)
  const repeatRx = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
  t = t.replace(repeatRx, '$1');
  t = t.replace(repeatRx, '$1');

  // Strip leading filler — run twice for double-stacked phrases like "please help me to"
  const fillerRx = /^(i need to|i have to|i want to|i must|i should|can you please|can you|please help me to|please help me|please|help me to|help me|i am going to|i am gonna|gonna|gotta|i'd like to|i'd love to|i would like to)\s+/i;
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
 * Check order (cheapest / most common first):
 *  1.  Too short
 *  2.  No letters at all (numbers / symbols / emoji only)
 *  3.  No real word (no 3-letter sequence)
 *  4.  Pure repeated characters  ("aaaa", "hhhh", "zzzzzz")
 *  5.  Offensive / profanity word
 *  6.  Gibberish — majority of multi-char words have zero vowels  ("sdgrgeg")
 *  7.  Single vague / reaction word  ("lol", "fire", "ok")
 *  8.  Only filler words / pronouns — no noun or verb with meaning
 *  9.  Keyboard mash pattern — alternating or sequential consonant runs
 */
function validateTaskMeaning(input) {
  const t     = input.trim();
  const lower = t.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  // ── 1. Too short
  if (t.length < MIN_TASK_LENGTH) {
    return 'Please describe your task in a few words.';
  }

  // ── 2. No letters at all
  if (!/[a-zA-Z]/.test(t)) {
    return "That doesn't look like a task. Please describe what you need to do.";
  }

  // ── 3. No real word (at least one sequence of 3+ letters)
  if (!/[a-zA-Z]{3,}/.test(t)) {
    return "That doesn't look like a task. Please describe what you need to do.";
  }

  // ── 4. Pure repeated characters  ("aaaa", "zzzzz", "haha" is fine — different chars)
  const noSpaces = lower.replace(/\s/g, '');
  if (/^(.)\1{3,}$/.test(noSpaces)) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  // ── 5. Offensive / profanity
  const hasOffensive = words.some(w => OFFENSIVE_WORDS.has(w.replace(/[^a-z]/g, '')));
  if (hasOffensive) {
    return "That doesn't look like a task. Please enter something you actually need to do.";
  }

  // ── 6. Gibberish — words with 4+ chars and zero vowels  ("sdgrgeg", "xkqzpf")
  const letterWords     = words.map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length >= 4);
  const gibberishWords  = letterWords.filter(w => !/[aeiou]/.test(w));
  if (letterWords.length > 0 && gibberishWords.length >= Math.ceil(letterWords.length * 0.5)) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  // ── 7. Single vague / reaction word
  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].replace(/[^a-z]/g, ''))) {
    return "That's too vague. Try something like \"Buy groceries tomorrow at 5pm\".";
  }

  // ── 8. Every word is a filler / pronoun — nothing meaningful
  const meaningfulWords = words.filter(w => !NON_TASK_FILLER.has(w.replace(/[^a-z]/g, '')));
  if (meaningfulWords.length === 0) {
    return "Please describe a real task — something you actually need to get done.";
  }

  // ── 9. Keyboard mash — long token that looks like alternating random consonants
  //       e.g. "asdfghjkl", "qwertyuiop", "zxcvbnm"
  const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const hasMash = words.some(w => {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length < 6) return false;
    // Check if 70%+ of the characters are from one keyboard row
    return KEYBOARD_ROWS.some(row => {
      const inRow = [...clean].filter(c => row.includes(c)).length;
      return inRow / clean.length >= 0.7;
    });
  });
  if (hasMash) {
    return 'Your input looks like random text. Please describe a real task.';
  }

  return null; // ✅ input passes all checks
}

// ─── Date helpers (server-side — LLM never computes dates) ───────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/** Format a Date object as "D Mon YYYY" */
function fmtDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Return the next strict-future occurrence of a given weekday (0=Sun … 6=Sat).
 * If today IS that weekday, still returns next week's occurrence.
 */
function nextWeekday(now, targetDow) {
  const d    = new Date(now);
  const diff = ((targetDow - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Build a pre-computed date lookup table injected into the prompt.
 * The LLM looks up dates from this table — no arithmetic ever needed.
 */
function buildDateContext() {
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const nextWeekend = nextWeekday(now, 6); // next Saturday

  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const endOfWeek = nextWeekday(now, 5); // next Friday as "end of week"

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

/** Apply smart Title Case (small words stay lowercase unless they are first). */
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (i === 0 || !LOWERCASE_TITLE_WORDS.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Sanitise the AI-generated title:
 *  • Apply Title Case
 *  • Strip trailing punctuation
 *  • Hard cap at 6 words (prompt asks for 3-5; this is a safety net)
 *  • Return null if result is empty or too short to be useful
 */
function sanitiseTitle(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim();
  t = t.replace(/[.!?,;:]+$/, '');         // strip trailing punctuation
  t = toTitleCase(t);
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 6) t = words.slice(0, 6).join(' ');
  t = t.trim();
  return t.length >= 2 ? t : null;
}

/**
 * Sanitise a single AI-generated step:
 *  • Strip list markers ("1.", "-", "•", "*")
 *  • Ensure the step starts with a capital letter
 *  • Hard cap at 15 words (prompt asks for 8; generous safety net)
 *  • Return null if result is empty
 */
function sanitiseStep(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  s = s.replace(/^[\d\-*•.)\s]+/, '');              // strip list markers
  s = s.replace(/\s{2,}/g, ' ').trim();             // normalise spaces
  if (!s) return null;
  s = s.charAt(0).toUpperCase() + s.slice(1);       // capitalise first letter
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
• Must start with an action verb: Create, Fix, Buy, Write, Plan, Call, Review, Build, Send, Prepare, Book, Complete, Schedule, Finish, Make, Draft, Submit, Organize, Set Up
• Title Case — capitalise every important word
• No punctuation at the end
• Remove ALL filler: "I need to", "I want to", "I have to", "I must", "please", "help me", "can you", "I should", "I'd like to"
• If words are repeated in the task (e.g. "have to have to"), ignore the repetition

Good title examples:
  "I need to create a report about AI"  →  "Create AI Report"
  "buy some milk at the store tomorrow" →  "Buy Milk at Store"
  "fix the login bug in my app"         →  "Fix Login Bug"
  "write a birthday song for mom"       →  "Write Birthday Song for Mom"
  "go to the gym at 6am"               →  "Go to the Gym"

════════════════════════════════
STEPS — read every rule carefully
════════════════════════════════
• Return EXACTLY 3 to 6 steps — never fewer than 3, never more than 6
• Each step = ONE sentence, MAX 8 words
• Start every step with an action verb: Open, Search, Write, Call, Download, Pick, Send, Save, Go, Buy, Check, Read, Fill, Book, Pay, Review, Draft, Set, Find, Visit, Add, Upload, Print, Sign, Confirm, Cancel, Install, Delete, Update, Prepare
• Plain simple English — imagine explaining to someone who has NEVER done this before
• Logical order: preparation → main action → review → completion
• ZERO duplicate steps
• NO vague filler steps: "Start the task", "Think about it", "You're done", "Get ready", "Begin working", "Get started"
• NO compound steps — never join two actions with "and then", "also", "then", "while"
• Adapt step count to task complexity — simple tasks need only 3, complex tasks can use up to 6

BAD steps (too long, vague, or compound):
  ✗ "Research various AI tools and platforms that can help you generate content efficiently"
  ✗ "Think about what you need and then decide the best approach before you start"
  ✗ "Go to the store and also pick up the items and then pay at the counter"

GOOD steps (short, clear, exactly one action):
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

/**
 * Parse and strictly validate the AI's JSON response.
 * Applies post-parse sanitisation so the frontend always gets clean, safe data.
 */
function parseResponse(text) {
  const empty = { title: null, steps: [], category: 'Other', when: null };
  if (!text || typeof text !== 'string') return empty;

  // Strip markdown code fences if the model ignored the instruction
  const stripped = text.trim().replace(/^```(?:json)?\s*|```\s*$/gm, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    // Last-resort fallback: treat non-empty lines as steps
    console.warn('[aiController] JSON parse failed. Raw snippet:', stripped.slice(0, 200));
    const lines = stripped
      .split('\n')
      .map(s => sanitiseStep(s))
      .filter(s => s && s.length > 4 && /[a-zA-Z]{3,}/.test(s));
    return { ...empty, steps: lines.slice(0, 6) };
  }

  // ── title
  const title = sanitiseTitle(typeof parsed.title === 'string' ? parsed.title : '');

  // ── steps — sanitise → filter → deduplicate (case-insensitive) → cap at 6
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

  // ── category — must exactly match one of our known values
  const validCategories = Object.keys(CATEGORY_META);
  const rawCat   = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  const category = validCategories.includes(rawCat) ? rawCat : 'Other';

  // ── when — strict format: "D Mon YYYY, h.mm am/pm"
  //    Accept:  "19 Mar 2026, 6.00 pm"  |  "5 Jan 2026, 11.30 am"
  //    Reject:  anything else — silently drop to avoid frontend issues
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

// ─── Fetch with abort timeout ─────────────────────────────────────────────────

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

        // Quota / rate-limit — won't recover on retry, throw immediately
        if (/quota|exceeded|rate.?limit/i.test(rawStr)) {
          throw { isQuota: true, message: 'AI quota exceeded. Try again later.' };
        }

        // 5xx server errors are worth retrying
        if (response.status >= 500 && attempt < retries) {
          lastError = new Error(rawStr);
          continue;
        }

        throw new Error(rawStr);
      }

      return data;

    } catch (err) {
      if (err?.isQuota) throw err;  // propagate quota errors immediately

      if (err.name === 'AbortError') {
        lastError = new Error('Request timed out. Please try again.');
        continue;  // timeouts are worth retrying
      }

      lastError = err;
      // Non-network errors (e.g. unexpected JSON) — no point retrying
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

  // ── 5. Guard: reject spam / offensive / gibberish / meaningless input
  //       This runs BEFORE any Groq API call — saves quota and gives instant feedback
  const meaningError = validateTaskMeaning(taskStr);
  if (meaningError) {
    return res.status(422).json({ error: meaningError });
  }

  // ── 6. Resolve model (whitelist prevents misconfigured GROQ_MODEL env var)
  const requestedModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const model = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'llama-3.1-8b-instant';

  const payload = {
    model,
    messages:    [{ role: 'user', content: buildPrompt(taskStr) }],
    temperature: 0.3,   // low = consistent, deterministic, no hallucination
    max_tokens:  700,   // enough for title + 6 steps + category + when + buffer
  };

  // ── 7. Call Groq with retry + exponential backoff
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

  // ── 8. Log latency + token usage for observability / cost tracking
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

  // Hard fail if no usable steps returned — better to show an error than empty UI
  if (steps.length < 1) {
    console.warn('[aiController] 0 valid steps parsed. Raw:', rawText.slice(0, 300));
    return res.status(500).json({
      error: 'AI returned no usable steps. Please try rephrasing your task.',
    });
  }

  // ── 10. Derive emoji + iconBg from detected category
  const { emoji, iconBg } = CATEGORY_META[category] ?? CATEGORY_META['Other'];

  // ── 11. Return response
  //        "when" is only included if it was present AND passed strict format validation
  return res.json({
    title:    title ?? taskStr,   // last-resort fallback: cleaned user input
    steps,
    category,
    emoji,
    iconBg,
    ...(when ? { when } : {}),
  });
}