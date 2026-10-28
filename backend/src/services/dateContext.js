const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];
const DATE_CONTEXT_TTL = 60 * 1000;
const dateContextCache = new Map();

export function normalizeTimeZone(value) {
  if (typeof value !== 'string' || value.length > 100) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return 'UTC';
  }
}

export function resolveRequestTimeZone(req) {
  return normalizeTimeZone(req?.body?.timeZone || req?.get?.('x-timezone'));
}

export function getDateKeyInTimeZone(date, timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function calendarAnchor(date, timeZone) {
  const [year, month, day] = getDateKeyInTimeZone(date, timeZone)
    .split('-')
    .map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function nextWeekday(date, targetDay) {
  const next = new Date(date);
  const diff = ((targetDay - next.getUTCDay()) + 7) % 7 || 7;
  next.setUTCDate(next.getUTCDate() + diff);
  return next;
}

export function buildDateContext(timeZone = 'UTC', now = new Date()) {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const today = calendarAnchor(now, safeTimeZone);
  const cacheKey = `${safeTimeZone}:${formatDate(today)}`;
  const cached = dateContextCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < DATE_CONTEXT_TTL) {
    return cached.value;
  }

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  const nextWeekend = nextWeekday(today, 6);
  const nextWeek = new Date(today);
  nextWeek.setUTCDate(today.getUTCDate() + 7);
  const endOfWeek = nextWeekday(today, 5);

  const value = [
    `Time zone     : ${safeTimeZone}`,
    `Today         : ${formatDate(today)}`,
    `Tonight       : ${formatDate(today)}  (use 9.00 pm unless a time is given)`,
    `Tomorrow      : ${formatDate(tomorrow)}`,
    `This weekend  : ${formatDate(nextWeekend)}`,
    `End of week   : ${formatDate(endOfWeek)}`,
    `Next week     : ${formatDate(nextWeek)}`,
    '',
    ...WEEKDAY_NAMES.map(
      (name, index) =>
        `Next ${name.padEnd(10)}: ${formatDate(nextWeekday(today, index))}`
    ),
  ].join('\n');

  dateContextCache.set(cacheKey, { timestamp: Date.now(), value });
  return value;
}
