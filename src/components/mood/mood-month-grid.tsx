import { dayOfMonth, formatLongDate, monthDates, weekdayIndex } from "@/lib/dates";
import { MOOD_LEVELS, moodStyle, type MoodEntry } from "@/lib/mood";
import { MoodOrb } from "./mood-orb";

const WEEKDAY_HEADS = ["M", "T", "W", "T", "F", "S", "S"];

type MoodMonthGridProps = {
  /** Any date in the month to draw. */
  month: string;
  today: string;
  entries: MoodEntry[];
};

/** The "Hard → Great" key: the seven orb colours in a row. */
export function MoodScaleLegend() {
  return (
    <div className="flex items-center gap-2 text-[11px] leading-4 font-semibold text-ink-muted md:text-caption">
      <span>Hard</span>
      <span aria-hidden="true" className="flex flex-1 justify-center gap-1 md:flex-none">
        {MOOD_LEVELS.map(({ level, color }) => (
          <span key={level} className="h-2.5 w-[22px] rounded-pill md:w-[18px]" style={{ backgroundColor: color }} />
        ))}
      </span>
      <span>Great</span>
    </div>
  );
}

/** A month of check-ins, Monday first. Days without one are a dashed outline, never a mark against you. */
export function MoodMonthGrid({ month, today, entries }: MoodMonthGridProps) {
  const dates = monthDates(month);
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));

  return (
    <div className="grid grid-cols-7 justify-items-center gap-2 md:gap-2.5">
      {WEEKDAY_HEADS.map((head, index) => (
        <span key={index} aria-hidden="true" className="text-[11px] font-semibold text-ink-muted md:text-caption">
          {head}
        </span>
      ))}
      <ol className="contents">
        {Array.from({ length: weekdayIndex(dates[0]) }, (_, index) => (
          <li key={`empty-${index}`} aria-hidden="true" />
        ))}
        {dates.map((date) => {
          const entry = byDate.get(date);
          const label = `${formatLongDate(date)}: ${entry ? moodStyle(entry.level).label : date > today ? "still to come" : "no check-in"}`;
          return (
            <li key={date} aria-label={label} className="flex size-[38px] items-center justify-center md:size-14">
              {entry ? (
                <>
                  <span className="text-[11px] md:hidden">
                    <MoodOrb level={entry.level} size={38} face={false}>
                      {dayOfMonth(date)}
                    </MoodOrb>
                  </span>
                  <span className="hidden text-[13px] md:block">
                    <MoodOrb level={entry.level} size={54} face={false}>
                      {dayOfMonth(date)}
                    </MoodOrb>
                  </span>
                </>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-[34px] items-center justify-center rounded-pill border border-dashed border-[#D9D0C1] text-[11px] font-medium text-[#646877] md:size-[50px] md:text-[13px]"
                >
                  {dayOfMonth(date)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
