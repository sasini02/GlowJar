export type MoodLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type MoodLevelStyle = {
  level: MoodLevel;
  label: string;
  /** Orb colour. Ink text and faces read on every one of these at 4.5:1 or more. */
  color: string;
  /** Mouth path for a face drawn in a -60 -60 120 120 viewBox. */
  mouth: string;
  /** A slightly bolder mouth for the small one-tap orbs, where the regular one would be too faint. */
  compactMouth: string;
};

// The one shared mood scale: Home, check-in and the mood board all draw from it.
export const MOOD_LEVELS: readonly MoodLevelStyle[] = [
  { level: 0, label: "Very unpleasant", color: "#8E9AC8", mouth: "M-12 15 Q0 3 12 15", compactMouth: "M-12 17 Q0 3 12 17" },
  { level: 1, label: "Unpleasant", color: "#9AAAD4", mouth: "M-11 13 Q0 6 11 13", compactMouth: "M-12 15 Q0 6 12 15" },
  { level: 2, label: "Slightly unpleasant", color: "#B9CCE8", mouth: "M-10 12 Q0 9 10 12", compactMouth: "M-11 13 Q0 9 11 13" },
  { level: 3, label: "Neutral", color: "#CFE2EC", mouth: "M-8 11 L8 10", compactMouth: "M-10 12 L10 11" },
  { level: 4, label: "Slightly pleasant", color: "#D3EAD8", mouth: "M-10 9 Q0 13 10 9", compactMouth: "M-11 9 Q0 14 11 9" },
  { level: 5, label: "Pleasant", color: "#F7D48C", mouth: "M-11 8 Q0 17 11 8", compactMouth: "M-12 8 Q0 19 12 8" },
  { level: 6, label: "Very pleasant", color: "#F2B544", mouth: "M-13 6 Q0 23 13 6", compactMouth: "M-14 6 Q0 25 14 6" },
];

export const MOOD_TAGS = ["Sleep", "Work", "Friends", "Family", "Health", "Weather", "Me time"] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

export function isMoodLevel(value: unknown): value is MoodLevel {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6;
}

export function isMoodTag(value: unknown): value is MoodTag {
  return MOOD_TAGS.includes(value as MoodTag);
}

export function moodStyle(level: number): MoodLevelStyle {
  return MOOD_LEVELS[Math.min(6, Math.max(0, Math.round(level)))];
}

export type MoodEntry = { date: string; level: MoodLevel; tags: MoodTag[] };

function average(levels: number[]): number {
  return levels.reduce((sum, level) => sum + level, 0) / levels.length;
}

export type MonthGlance = { bright: number; steady: number; heavy: number };

export function monthGlance(entries: MoodEntry[]): MonthGlance {
  return {
    bright: entries.filter((entry) => entry.level >= 4).length,
    steady: entries.filter((entry) => entry.level === 3).length,
    heavy: entries.filter((entry) => entry.level <= 2).length,
  };
}

/** Check-ins needed on each side before comparing days with and without a win. */
export const MIN_CHECK_INS_TO_COMPARE = 5;

export type WinsAndMood = { litAverage: number; unlitAverage: number };

/** Average mood on days with a win against days without. Null until there's enough to say anything fair. */
export function winsAndMood(entries: MoodEntry[], litDates: ReadonlySet<string>): WinsAndMood | null {
  const lit = entries.filter((entry) => litDates.has(entry.date)).map((entry) => entry.level);
  const unlit = entries.filter((entry) => !litDates.has(entry.date)).map((entry) => entry.level);
  if (lit.length < MIN_CHECK_INS_TO_COMPARE || unlit.length < MIN_CHECK_INS_TO_COMPARE) return null;
  return { litAverage: average(lit), unlitAverage: average(unlit) };
}

/** A tag must appear on this many days before it says anything about the month. */
export const MIN_TAGGED_DAYS = 3;
const NOTICEABLE_DIFFERENCE = 0.5;
const MAX_TAG_INSIGHTS = 3;

export type TagInsight = { tag: MoodTag; days: number; difference: number; effect: "lifts" | "watch" };

/** Tags whose days sit clearly above or below the month's average mood, strongest first. */
export function tagInsights(entries: MoodEntry[]): TagInsight[] {
  if (entries.length === 0) return [];
  const monthAverage = average(entries.map((entry) => entry.level));

  return MOOD_TAGS.flatMap((tag): TagInsight[] => {
    const tagged = entries.filter((entry) => entry.tags.includes(tag));
    if (tagged.length < MIN_TAGGED_DAYS) return [];
    const difference = average(tagged.map((entry) => entry.level)) - monthAverage;
    if (difference >= NOTICEABLE_DIFFERENCE) return [{ tag, days: tagged.length, difference, effect: "lifts" }];
    if (difference <= -NOTICEABLE_DIFFERENCE) return [{ tag, days: tagged.length, difference, effect: "watch" }];
    return [];
  })
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, MAX_TAG_INSIGHTS);
}

/** True when the three most recent check-ins were all heavy, so Home can offer the Hard Day screen. */
export function hadHeavyStretch(entries: MoodEntry[]): boolean {
  const recent = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  return recent.length === 3 && recent.every((entry) => entry.level <= 2);
}
