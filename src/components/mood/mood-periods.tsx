import { addMonths, dayOfMonth, formatLongDate, formatMonth, formatWeekdayShort, monthDates } from "@/lib/dates";
import { moodStyle, type MoodEntry } from "@/lib/mood";
import { MoodOrb } from "./mood-orb";

/** This week, Monday to Sunday, one orb per day. */
export function MoodWeek({ dates, today, entries }: { dates: string[]; today: string; entries: MoodEntry[] }) {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  return (
    <ol className="grid grid-cols-7 gap-2">
      {dates.map((date) => {
        const entry = byDate.get(date);
        const label = entry ? moodStyle(entry.level).label : date > today ? "Still to come" : "No check-in";
        return (
          <li key={date} aria-label={`${formatLongDate(date)}: ${label}`} className="flex flex-col items-center gap-2 text-center">
            <span aria-hidden="true" className={`text-caption ${date === today ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {formatWeekdayShort(date)} {dayOfMonth(date)}
            </span>
            {entry ? (
              <MoodOrb level={entry.level} size={44} />
            ) : (
              <span aria-hidden="true" className="size-11 rounded-pill border border-dashed border-[#D9D0C1]" />
            )}
            <span aria-hidden="true" className="hidden text-caption text-ink-muted md:block">
              {entry ? label : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Every month of this year so far: a small dot per day, coloured by mood. */
export function MoodYear({ today, entries }: { today: string; entries: MoodEntry[] }) {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const firstMonth = `${today.slice(0, 4)}-01-01`;
  const months = Array.from({ length: Number(today.slice(5, 7)) }, (_, index) => addMonths(firstMonth, index)).reverse();

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {months.map((month) => {
        const dates = monthDates(month);
        const checkIns = dates.filter((date) => byDate.has(date)).length;
        return (
          <li key={month} className="rounded-[20px] border border-line p-4">
            <p className="flex justify-between text-label">
              <span className="text-ink">{formatMonth(month)}</span>
              <span className="text-ink-muted">
                {checkIns} {checkIns === 1 ? "check-in" : "check-ins"}
              </span>
            </p>
            <div aria-hidden="true" className="mt-3 flex flex-wrap gap-1">
              {dates.map((date) => {
                const entry = byDate.get(date);
                return entry ? (
                  <span key={date} className="size-2.5 rounded-pill" style={{ backgroundColor: moodStyle(entry.level).color }} />
                ) : (
                  <span key={date} className={`size-2.5 rounded-pill ${date > today ? "bg-transparent" : "bg-[#F1EADF]"}`} />
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
