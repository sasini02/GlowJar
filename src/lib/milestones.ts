export const MILESTONES = [3, 7, 14, 30, 50, 100] as const;

export type JarStyle = "classic" | "ember" | "moonlit" | "firefly" | "aurora" | "starlit" | "lantern";

type Milestone = {
  days: number;
  title: string;
  line: string;
  style: JarStyle;
  reward: string;
};

const MILESTONE_DETAILS: Milestone[] = [
  {
    days: 3,
    title: "Three little lights",
    line: "You showed up for yourself 3 days in a row. A little light is catching.",
    style: "ember",
    reward: "Ember jar",
  },
  {
    days: 7,
    title: "A whole week of little lights",
    line: "You showed up for yourself 7 days in a row. A whole week of noticing.",
    style: "moonlit",
    reward: "Moonlit jar",
  },
  {
    days: 14,
    title: "Two weeks of little lights",
    line: "You showed up for yourself 14 days in a row. That's a habit forming.",
    style: "firefly",
    reward: "Firefly jar",
  },
  {
    days: 30,
    title: "A month of little lights",
    line: "You showed up for yourself 30 days in a row. A whole month of little lights.",
    style: "aurora",
    reward: "Aurora jar",
  },
  {
    days: 50,
    title: "Fifty days of little lights",
    line: "You showed up for yourself 50 days in a row. Your jar is full of proof.",
    style: "starlit",
    reward: "Starlit jar",
  },
  {
    days: 100,
    title: "A hundred days of little lights",
    line: "You showed up for yourself 100 days in a row. That's who you are now.",
    style: "lantern",
    reward: "Lantern jar",
  },
];

export function milestoneFor(days: number): Milestone | null {
  return MILESTONE_DETAILS.find((milestone) => milestone.days === days) ?? null;
}

/** The next milestone above `current`, or null once every milestone is behind it. */
export function nextMilestone(current: number): number | null {
  return MILESTONES.find((days) => days > current) ?? null;
}

/** The milestone just below the next one (0 before the first), for drawing progress between them. */
export function previousMilestone(current: number): number {
  return [...MILESTONES].reverse().find((days) => days <= current) ?? 0;
}

/** Milestones the streak has reached that haven't been recorded yet. */
export function newlyReached(current: number, recorded: ReadonlySet<number>): number[] {
  return MILESTONES.filter((days) => days <= current && !recorded.has(days));
}

export function isJarStyle(value: string): value is JarStyle {
  return value === "classic" || MILESTONE_DETAILS.some((milestone) => milestone.style === value);
}
