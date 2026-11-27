import { describe, expect, it } from "vitest";
import { newlyReached, nextMilestone, previousMilestone } from "./milestones";
import { computeStreak } from "./streak";

// 26 November 2026 is a Thursday. Its week runs Monday 23 to Sunday 29.
const THURSDAY = "2026-11-26";

function lit(...dates: string[]) {
  return new Set(dates);
}

function kinds(streak: ReturnType<typeof computeStreak>) {
  return streak.week.map((day) => day.kind);
}

describe("computeStreak", () => {
  it("keeps the streak while today is still pending", () => {
    const streak = computeStreak(lit("2026-11-23", "2026-11-24", "2026-11-25"), THURSDAY);

    expect(streak.current).toBe(3);
    expect(streak.todayLit).toBe(false);
    expect(kinds(streak)).toEqual(["lit", "lit", "lit", "today-pending", "future", "future", "future"]);
    expect(streak.restLeftThisWeek).toBe(2);
  });

  it("counts today once it is lit", () => {
    const streak = computeStreak(lit("2026-11-24", "2026-11-25", THURSDAY), THURSDAY);

    expect(streak.current).toBe(3);
    expect(streak.todayLit).toBe(true);
    expect(streak.week[3].kind).toBe("lit");
  });

  it("uses up to two rest days in a week and counts them", () => {
    const streak = computeStreak(lit("2026-11-22", "2026-11-23", THURSDAY), THURSDAY);

    expect(streak.current).toBe(5);
    expect(kinds(streak).slice(0, 4)).toEqual(["lit", "rest", "rest", "lit"]);
    expect(streak.restLeftThisWeek).toBe(0);
  });

  it("pauses at a third unlit day in the same week, without taking lights away", () => {
    const streak = computeStreak(
      lit("2026-11-15", "2026-11-18", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23"),
      "2026-11-23",
    );

    // 23 to 20 lit, 19 rest, 18 lit, 17 rest; 16 is the third unlit day that week.
    // 17 is then trimmed, because the streak starts on a lit day.
    expect(streak.current).toBe(6);
    expect(streak.month["2026-11-19"]).toBe("rest");
    expect(streak.month["2026-11-17"]).toBe("quiet");
    expect(streak.month["2026-11-16"]).toBe("quiet");
    expect(streak.month["2026-11-15"]).toBe("lit");
  });

  it("trims rest days before the first light", () => {
    const streak = computeStreak(lit(THURSDAY), THURSDAY);

    expect(streak.current).toBe(1);
    expect(kinds(streak).slice(0, 4)).toEqual(["quiet", "quiet", "quiet", "lit"]);
    expect(streak.restLeftThisWeek).toBe(2);
  });

  it("trims rest days that only bridge to a pause", () => {
    // 24, 23 rest in this week; 22, 21 rest in last week; 20 would be a third, so it stops.
    const streak = computeStreak(lit("2026-11-19", "2026-11-25"), "2026-11-25");

    expect(streak.current).toBe(1);
    expect(streak.month["2026-11-24"]).toBe("quiet");
    expect(streak.month["2026-11-19"]).toBe("lit");
  });

  it("gives each Monday–Sunday week its own two rest days", () => {
    // Fri 20 and Sat 21 rest last week; Mon 23 and Tue 24 rest this week.
    const streak = computeStreak(lit("2026-11-19", "2026-11-22", "2026-11-25"), "2026-11-25");

    expect(streak.current).toBe(7);
    expect(streak.month["2026-11-20"]).toBe("rest");
    expect(streak.month["2026-11-21"]).toBe("rest");
    expect(streak.month["2026-11-23"]).toBe("rest");
    expect(streak.month["2026-11-24"]).toBe("rest");
    expect(streak.restLeftThisWeek).toBe(0);
  });

  it("rests at zero when the last light was a while ago", () => {
    const streak = computeStreak(lit("2026-11-10", "2026-11-11"), THURSDAY);

    expect(streak.current).toBe(0);
    expect(streak.month["2026-11-10"]).toBe("lit");
    expect(streak.month["2026-11-25"]).toBe("quiet");
    expect(streak.week[3].kind).toBe("today-pending");
  });

  it("handles a jar with no lights yet", () => {
    const streak = computeStreak(lit(), THURSDAY);

    expect(streak.current).toBe(0);
    expect(streak.restLeftThisWeek).toBe(2);
    expect(Object.values(streak.month).filter((kind) => kind === "lit")).toHaveLength(0);
  });

  it("marks the rest of the month as future", () => {
    const streak = computeStreak(lit(THURSDAY), THURSDAY);

    expect(Object.keys(streak.month)).toHaveLength(30);
    expect(streak.month["2026-11-27"]).toBe("future");
    expect(streak.month["2026-11-30"]).toBe("future");
  });

  it("follows the streak across a month boundary", () => {
    const streak = computeStreak(lit("2026-11-29", "2026-11-30", "2026-12-01"), "2026-12-01");

    expect(streak.current).toBe(3);
    expect(Object.keys(streak.month)).toHaveLength(31);
  });
});

describe("milestones", () => {
  it("finds the next milestone", () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(3)).toBe(7);
    expect(nextMilestone(99)).toBe(100);
    expect(nextMilestone(100)).toBeNull();
  });

  it("finds the milestone already passed", () => {
    expect(previousMilestone(2)).toBe(0);
    expect(previousMilestone(9)).toBe(7);
  });

  it("lists every milestone reached but not yet recorded", () => {
    expect(newlyReached(15, new Set([3]))).toEqual([7, 14]);
    expect(newlyReached(2, new Set())).toEqual([]);
  });
});
