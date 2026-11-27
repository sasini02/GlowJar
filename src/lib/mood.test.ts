import { describe, expect, it } from "vitest";
import { hadHeavyStretch, monthGlance, moodStyle, tagInsights, winsAndMood, type MoodEntry, type MoodLevel, type MoodTag } from "./mood";

function entry(day: number, level: MoodLevel, tags: MoodTag[] = []): MoodEntry {
  return { date: `2026-11-${String(day).padStart(2, "0")}`, level, tags };
}

describe("moodStyle", () => {
  it("clamps and rounds to the seven-step scale", () => {
    expect(moodStyle(-1).label).toBe("Very unpleasant");
    expect(moodStyle(4.4).label).toBe("Slightly pleasant");
    expect(moodStyle(9).label).toBe("Very pleasant");
  });
});

describe("monthGlance", () => {
  it("splits days into bright, steady and heavy", () => {
    const glance = monthGlance([entry(1, 6), entry(2, 4), entry(3, 3), entry(4, 2), entry(5, 0)]);
    expect(glance).toEqual({ bright: 2, steady: 1, heavy: 2 });
  });
});

describe("winsAndMood", () => {
  const entries = [
    ...[1, 2, 3, 4, 5].map((day) => entry(day, 5)),
    ...[6, 7, 8, 9, 10].map((day) => entry(day, 3)),
  ];

  it("compares days with a win against days without", () => {
    const lit = new Set(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]);
    expect(winsAndMood(entries, lit)).toEqual({ litAverage: 5, unlitAverage: 3 });
  });

  it("waits for five check-ins on each side", () => {
    const lit = new Set(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"]);
    expect(winsAndMood(entries, lit)).toBeNull();
  });
});

describe("tagInsights", () => {
  it("names tags that lift the month and tags worth watching", () => {
    const insights = tagInsights([
      entry(1, 6, ["Friends"]),
      entry(2, 6, ["Friends"]),
      entry(3, 5, ["Friends"]),
      entry(4, 1, ["Work"]),
      entry(5, 2, ["Work"]),
      entry(6, 1, ["Work"]),
      entry(7, 3, ["Weather"]),
      entry(8, 4, ["Weather"]),
      entry(9, 4, ["Weather"]),
    ]);

    expect(insights.map((insight) => [insight.tag, insight.effect])).toEqual([
      ["Work", "watch"],
      ["Friends", "lifts"],
    ]);
    expect(insights[1].days).toBe(3);
  });

  it("ignores tags used on fewer than three days", () => {
    expect(tagInsights([entry(1, 6, ["Sleep"]), entry(2, 6, ["Sleep"]), entry(3, 1), entry(4, 1)])).toEqual([]);
  });
});

describe("hadHeavyStretch", () => {
  it("is true when the last three check-ins were all heavy", () => {
    expect(hadHeavyStretch([entry(1, 6), entry(2, 2), entry(3, 1), entry(4, 0)])).toBe(true);
  });

  it("is false when one of the last three was lighter", () => {
    expect(hadHeavyStretch([entry(2, 2), entry(3, 4), entry(4, 0)])).toBe(false);
  });

  it("needs three check-ins", () => {
    expect(hadHeavyStretch([entry(3, 1), entry(4, 0)])).toBe(false);
  });
});
