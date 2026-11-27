import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { DAILY_NOTES, noteForDate } from "./daily-notes";

describe("noteForDate", () => {
  it("gives the same note all day", () => {
    expect(noteForDate("2026-11-27")).toBe(noteForDate("2026-11-27"));
  });

  it("changes from one day to the next", () => {
    for (let day = 0; day < 60; day += 1) {
      const date = addDays("2026-11-01", day);
      expect(noteForDate(date)).not.toBe(noteForDate(addDays(date, 1)));
    }
  });

  it("shows every note once before any repeats", () => {
    const seen = new Set(Array.from({ length: DAILY_NOTES.length }, (_, day) => noteForDate(addDays("2026-11-01", day))));
    expect(seen.size).toBe(DAILY_NOTES.length);
  });

  it("works for dates before the reference date", () => {
    expect(DAILY_NOTES).toContain(noteForDate("2025-06-15"));
  });
});
