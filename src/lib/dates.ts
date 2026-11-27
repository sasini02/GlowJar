// Calendar-date helpers working on "YYYY-MM-DD" strings, so a date never shifts
// with the server's or browser's timezone.

/** Today's date in the given IANA timezone. */
export function localToday(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    now,
  );
}

function toUtcNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

/** Adds calendar months, clamping to the end of shorter months (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = toUtcNoon(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcNoon(toIso).getTime() - toUtcNoon(fromIso).getTime()) / 86_400_000);
}

export function formatLongDate(isoDate: string): string {
  return toUtcNoon(isoDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "October", or "October 2025" when `withYear` is set. Takes any date inside the month. */
export function formatMonth(isoDate: string, { withYear = false }: { withYear?: boolean } = {}): string {
  return toUtcNoon(isoDate).toLocaleDateString("en-GB", {
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** "Oct 25" style label for the jar shelf. */
export function formatShortMonth(isoDate: string): string {
  return toUtcNoon(isoDate).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
}

/** The local calendar date of a timestamp in the given IANA timezone. */
export function toLocalDate(timestamp: string | Date, timezone: string): string {
  return localToday(timezone, typeof timestamp === "string" ? new Date(timestamp) : timestamp);
}

/** 0 for Monday through 6 for Sunday: Glowjar weeks start on Monday. */
export function weekdayIndex(isoDate: string): number {
  return (toUtcNoon(isoDate).getUTCDay() + 6) % 7;
}

/** The Monday of the week that contains `isoDate`. */
export function startOfWeek(isoDate: string): string {
  return addDays(isoDate, -weekdayIndex(isoDate));
}

/** The seven dates, Monday to Sunday, of the week that contains `isoDate`. */
export function weekDates(isoDate: string): string[] {
  const monday = startOfWeek(isoDate);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/** Every date in the month that contains `isoDate`, from the 1st. */
export function monthDates(isoDate: string): string[] {
  const first = startOfMonth(isoDate);
  const length = daysBetween(first, addMonths(first, 1));
  return Array.from({ length }, (_, index) => addDays(first, index));
}

/** "Thursday, 26 November" */
export function formatDayHeading(isoDate: string): string {
  return toUtcNoon(isoDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** "M", "T", "W"... for compact week rows. */
export function formatWeekdayLetter(isoDate: string): string {
  return formatWeekdayShort(isoDate).charAt(0);
}

/** "Mon", "Tue"... */
export function formatWeekdayShort(isoDate: string): string {
  return toUtcNoon(isoDate).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}

/** "Monday", "Tuesday"... for accessible labels. */
export function formatWeekdayLong(isoDate: string): string {
  return toUtcNoon(isoDate).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}
