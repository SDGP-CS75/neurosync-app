const FALLBACK_TIME_ZONE = "UTC";

export function getUserTimeZone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE
    );
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

export function getDateKeyForTimeZone(
  date: Date,
  timeZone = getUserTimeZone()
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getLocalDateKey(date = new Date()): string {
  return getDateKeyForTimeZone(date);
}

export function getTodayKey(): string {
  return getLocalDateKey(new Date());
}
