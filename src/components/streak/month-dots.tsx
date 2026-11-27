import Link from "next/link";
import { dayOfMonth, formatLongDate, weekdayIndex } from "@/lib/dates";
import type { DayKind } from "@/lib/streak";

const KIND_LABELS: Record<DayKind, string> = {
  lit: "win added",
  rest: "rest day",
  "today-pending": "today, not lit yet",
  quiet: "quiet day",
  future: "still to come",
};

const WEEKDAY_HEADS = ["M", "T", "W", "T", "F", "S", "S"];

type MonthDotsProps = {
  month: Record<string, DayKind>;
  today: string;
  monthName: string;
};

function Dot({ date, kind, isToday }: { date: string; kind: DayKind; isToday: boolean }) {
  const n = dayOfMonth(date);
  const base = "flex items-center justify-center rounded-pill text-[11px] md:text-[13px]";
  if (kind === "lit") return <span className={`${base} size-[30px] bg-[#F2B544] font-bold text-[#2A2D3A] md:size-10`}>{n}</span>;
  if (kind === "rest") return <span className={`${base} size-[30px] bg-[#A9C9B2] font-bold text-[#2A2D3A] md:size-10`}>{n}</span>;
  if (isToday) return <span className={`${base} size-[26px] border-2 border-glow-ink font-bold text-glow-ink md:size-9`}>{n}</span>;
  if (kind === "future") {
    return <span className={`${base} size-7 border border-dashed border-[#D9D0C1] font-medium text-ink-muted md:size-[38px]`}>{n}</span>;
  }
  return <span className={`${base} size-[30px] bg-[#F1EADF] font-semibold text-[#646877] md:size-10`}>{n}</span>;
}

function Legend({ long }: { long: boolean }) {
  const items = [
    { color: "bg-[#F2B544]", label: long ? "Win added" : "Win" },
    { color: "bg-[#A9C9B2]", label: long ? "Rest day" : "Rest" },
    { color: "bg-[#F1EADF]", label: long ? "Quiet day" : "Quiet" },
  ];
  return (
    <ul className="flex flex-wrap gap-3.5 text-caption font-normal text-ink-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`size-2.5 rounded-pill ${item.color}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * "Your November jar": a dot per day. Phones show the days in a simple run of
 * sevens; wider screens line them up under weekday letters. Quiet days are
 * never shown as missed.
 */
export function MonthDots({ month, today, monthName }: MonthDotsProps) {
  const dates = Object.keys(month).sort();
  const leading = dates.length > 0 ? weekdayIndex(dates[0]) : 0;
  const heading = `Your ${monthName} jar`;

  const dots = dates.map((date) => (
    <li
      key={date}
      aria-label={`${formatLongDate(date)}: ${date === today && month[date] === "lit" ? "today, win added" : KIND_LABELS[month[date]]}`}
      className="flex size-[30px] items-center justify-center md:size-10"
    >
      <span aria-hidden="true">
        <Dot date={date} kind={month[date]} isToday={date === today} />
      </span>
    </li>
  ));

  return (
    <section aria-label={heading}>
      {/* Phones: heading outside the card */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[20px] leading-[26px] font-semibold">
            {heading}
          </h2>
          <Link href="/jar" className="text-label font-semibold text-glow-ink hover:underline">
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-3.5 rounded-[24px] bg-surface-raised p-4 shadow-card">
          <ol className="grid grid-cols-7 justify-items-center gap-2">{dots}</ol>
          <Legend long />
        </div>
      </div>

      {/* Wider: one card, legend in the header, weekday letters */}
      <div className="hidden h-full flex-col gap-4 rounded-[28px] bg-surface-raised p-6 shadow-card md:flex">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-[22px] leading-7 font-semibold">{heading}</h2>
          <Legend long={false} />
        </div>
        <div className="grid grid-cols-7 justify-items-center gap-2">
          {WEEKDAY_HEADS.map((head, index) => (
            <span key={index} aria-hidden="true" className="text-caption font-semibold text-ink-muted">
              {head}
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7 justify-items-center gap-2">
          {Array.from({ length: leading }, (_, index) => (
            <li key={`empty-${index}`} aria-hidden="true" className="size-10" />
          ))}
          {dots}
        </ol>
      </div>
    </section>
  );
}
