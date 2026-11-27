import { addDays, monthDates, startOfWeek, weekDates } from "./dates";

export type DayKind = "lit" | "rest" | "today-pending" | "quiet" | "future";

/** Unlit days per Monday–Sunday week that keep the streak safe. */
export const REST_DAYS_PER_WEEK = 2;

export type Streak = {
  /** Days in the streak, rest days included. Zero means the jar is resting. */
  current: number;
  restLeftThisWeek: number;
  todayLit: boolean;
  /** Monday to Sunday of the current week. */
  week: { date: string; kind: DayKind }[];
  /** Every date of the current month. */
  month: Record<string, DayKind>;
};

/**
 * Works out the glow streak from the local dates on which the user added at
 * least one win. All dates are "YYYY-MM-DD" in the user's own timezone.
 *
 * The streak never resets as a punishment: unlit days use up to two rest days
 * a week, and when those run out the streak pauses. Lights are never taken away,
 * so lit days outside the streak still show as lit.
 */
export function computeStreak(litDates: ReadonlySet<string>, today: string): Streak {
  const todayLit = litDates.has(today);
  const earliestLit = [...litDates].reduce<string | null>((min, date) => (min === null || date < min ? date : min), null);

  // Newest first. Today only counts once it's lit: until midnight it's still pending.
  const counted: { date: string; kind: "lit" | "rest" }[] = todayLit ? [{ date: today, kind: "lit" }] : [];
  const restUsed = new Map<string, number>();

  for (let day = addDays(today, -1); earliestLit !== null && day >= earliestLit; day = addDays(day, -1)) {
    if (litDates.has(day)) {
      counted.push({ date: day, kind: "lit" });
      continue;
    }
    const week = startOfWeek(day);
    const used = restUsed.get(week) ?? 0;
    if (used >= REST_DAYS_PER_WEEK) break;
    restUsed.set(week, used + 1);
    counted.push({ date: day, kind: "rest" });
  }

  // A streak always starts on a lit day, so rest days before the first light don't count.
  while (counted.length > 0 && counted[counted.length - 1].kind === "rest") counted.pop();

  const restDays = new Set(counted.filter((day) => day.kind === "rest").map((day) => day.date));
  const thisWeek = startOfWeek(today);
  const restUsedThisWeek = [...restDays].filter((date) => startOfWeek(date) === thisWeek).length;

  function kindOf(date: string): DayKind {
    if (date > today) return "future";
    if (litDates.has(date)) return "lit";
    if (date === today) return "today-pending";
    if (restDays.has(date)) return "rest";
    return "quiet";
  }

  return {
    current: counted.length,
    restLeftThisWeek: REST_DAYS_PER_WEEK - restUsedThisWeek,
    todayLit,
    week: weekDates(today).map((date) => ({ date, kind: kindOf(date) })),
    month: Object.fromEntries(monthDates(today).map((date) => [date, kindOf(date)])),
  };
}
