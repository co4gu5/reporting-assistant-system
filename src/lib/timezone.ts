const DEFAULT_SERVER_TIMEZONE = "America/New_York";

export function getServerTimezone(): string {
  return (
    process.env.SERVER_TIMEZONE ||
    process.env.TZ ||
    DEFAULT_SERVER_TIMEZONE
  );
}

/** Returns "HH:MM" in the given IANA timezone, reliably on all Node.js versions. */
export function getCurrentHHMM(
  date: Date,
  timezone = getServerTimezone()
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** Returns "YYYY-MM-DD" in the given IANA timezone. */
export function getLocalDateStr(
  date: Date,
  timezone = getServerTimezone()
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

/**
 * Returns the UTC Date objects for [start-of-day, start-of-next-day)
 * in the given IANA timezone.
 */
export function getDayBoundsUTC(
  date: Date,
  timezone = getServerTimezone()
): [Date, Date] {
  const dateStr = getLocalDateStr(date, timezone);
  const [year, month, day] = dateStr.split("-").map(Number);

  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const localMidnightStr = `${dateStr}T00:00:00`;

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const localNoonStr = formatter.format(probe);
  const localNoon = new Date(localNoonStr.replace(" ", "T") + "Z");
  const probeMid = new Date(localMidnightStr + "Z");
  const offsetMs = probe.getTime() - localNoon.getTime();
  const startUTC = new Date(probeMid.getTime() + offsetMs);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

  return [startUTC, endUTC];
}

export function getDayBoundsForDateStr(
  dateStr: string,
  timezone = getServerTimezone()
): [Date, Date] {
  const [year, month, day] = dateStr.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return getDayBoundsUTC(probe, timezone);
}

function shiftDateStr(
  dateStr: string,
  days: number,
  timezone = getServerTimezone()
): string {
  if (days === 0) return dateStr;

  let current = dateStr;
  const step = days > 0 ? 1 : -1;

  for (let index = 0; index < Math.abs(days); index++) {
    if (step > 0) {
      const [, end] = getDayBoundsForDateStr(current, timezone);
      current = getLocalDateStr(end, timezone);
    } else {
      const [start] = getDayBoundsForDateStr(current, timezone);
      current = getLocalDateStr(new Date(start.getTime() - 1), timezone);
    }
  }

  return current;
}

function getWeekdayShort(
  dateStr: string,
  timezone = getServerTimezone()
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(probe);
}

/** Mon–Fri date strings (YYYY-MM-DD) for the week containing referenceDate. */
export function getCurrentWeekDateStrings(
  referenceDate = new Date(),
  timezone = getServerTimezone()
): string[] {
  const todayStr = getLocalDateStr(referenceDate, timezone);
  const weekday = getWeekdayShort(todayStr, timezone);
  const weekdayOffsets: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const dayIndex = weekdayOffsets[weekday] ?? 0;
  const mondayOffset =
    dayIndex <= 4 ? -dayIndex : dayIndex === 5 ? -5 : -6;
  const mondayStr = shiftDateStr(todayStr, mondayOffset, timezone);

  return Array.from({ length: 5 }, (_, index) =>
    shiftDateStr(mondayStr, index, timezone)
  );
}

/** Inclusive index into Mon–Fri (0–4), or Friday on weekends. */
export function getTodayWeekdayIndex(
  referenceDate = new Date(),
  timezone = getServerTimezone()
): number {
  const todayStr = getLocalDateStr(referenceDate, timezone);
  const weekDates = getCurrentWeekDateStrings(referenceDate, timezone);
  const index = weekDates.indexOf(todayStr);
  return index === -1 ? weekDates.length - 1 : index;
}
