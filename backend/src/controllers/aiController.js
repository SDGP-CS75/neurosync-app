/**
 * AI controller — Task breakdown via Groq (OpenAI-compatible API).
 * Expects GROQ_API_KEY in env.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getTodayFormatted() {
  const d = new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${mon} ${year}`;
}

const BREAKDOWN_PROMPT = (task) => {
  const todayStr = getTodayFormatted();
  return `You are a task planner. Today's date is ${todayStr}.

For the task below:
1. Break it into 3 to 6 clear, ordered sub-tasks. Each sub-task = one short sentence.

2. AUTO-DETECT time/date: If the task mentions ANY time or date, you MUST set "when" in format "DD Mon YYYY, h.mm am/pm".
- Only a time (e.g. "at 6pm", "8.pm", "by 5pm") → use TODAY (${todayStr}) with that time. Treat "8.pm" or "8pm" as 8.00 pm.
- Only a day with no time (e.g. "tomorrow", "create a song tomorrow", "next Monday", "before next Monday") → use that day's date with default time "5.00 pm".
- Day + time (e.g. "tomorrow at 3pm", "next Monday 8.pm", "bake a cake before next monday 8.pm") → use that day's date and the given time (treat "8.pm" as 8.00 pm).
If no time or date is mentioned at all, omit "when".

Return ONLY a valid JSON object, no other text:
- "steps": array of sub-task strings
- "when": (optional) due date/time "DD Mon YYYY, h.mm am/pm"

Examples:
- "create a song tomorrow" → "when": "<tomorrow's date>, 5.00 pm"
- "bake a cake before next monday 8.pm" → "when": "<next Monday's date>, 8.00 pm"
- "bake a cake at 6pm" → "when": "${todayStr}, 6.00 pm"

Task: ${task}`;
};

/**
 * Parse response text and extract { steps, when }.
 * Handles markdown code blocks and plain JSON.
 */
function parseBreakdownResponse(text) {
  const result = { steps: [], when: null };
  if (!text || typeof text !== 'string') return result;
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.steps)) {
      result.steps = parsed.steps
        .filter((s) => typeof s === 'string')
        .map((s) => String(s).trim())
        .filter(Boolean);
    } else if (Array.isArray(parsed)) {
      result.steps = parsed.filter((s) => typeof s === 'string').map((s) => String(s).trim()).filter(Boolean);
    }
    if (parsed && typeof parsed.when === 'string' && parsed.when.trim()) {
      result.when = parsed.when.trim();
    }
  } catch (_) {
    result.steps = trimmed
      .split(/\n/)
      .map((s) => s.replace(/^[\d\-*.]+\s*/, '').trim())
      .filter(Boolean);
  }
  return result;
}

export async function breakTaskIntoSteps(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  const { task } = req.body || {};
  const taskStr = typeof task === 'string' ? task.trim() : '';
  if (!taskStr) {
    return res.status(400).json({ error: 'Missing or empty task' });
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const payload = {
    model,
    messages: [{ role: 'user', content: BREAKDOWN_PROMPT(taskStr) }],
    temperature: 0.3,
  };

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      const raw = data?.error?.message || data?.error || 'Groq API error';
      const isQuota = typeof raw === 'string' && /quota|exceeded|rate.limit/i.test(raw);
      const message = isQuota
        ? 'AI quota exceeded. Try again later.'
        : raw;
      return res.status(response.status).json({ error: message });
    }

    const textPart = data?.choices?.[0]?.message?.content;
    const { steps, when } = parseBreakdownResponse(textPart);
    const body = when ? { steps, when } : { steps };
    return res.json(body);
  } catch (err) {
    console.error('Groq breakdown error:', err);
    return res.status(500).json({ error: err.message || 'Failed to break task into steps' });
  }
}
