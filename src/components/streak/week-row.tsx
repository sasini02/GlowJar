import { Moon } from "lucide-react";
import { SparkleIcon } from "@/components/ui/icons";
import { dayOfMonth, formatWeekdayLetter, formatWeekdayLong, formatWeekdayShort } from "@/lib/dates";
import type { DayKind } from "@/lib/streak";

const KIND_LABELS: Record<DayKind, string> = {
  lit: "lit",
  rest: "rest day",
  "today-pending": "not lit yet",
  quiet: "quiet",
  future: "still to come",
};

type WeekRowProps = {
  week: { date: string; kind: DayKind }[];
  today: string;
  /** Plays the glow on today's light, for the moment it has just been lit. */
  justLit?: boolean;
};

/** Monday to Sunday on the streak card. Letters on phones; short names and dates on wider screens. */
export function WeekRow({ week, today, justLit = false }: WeekRowProps) {
  return (
    <ol className="grid grid-cols-7 gap-1 rounded-[20px] bg-white/6 px-2 py-3 md:gap-2 md:p-3.5">
      {week.map(({ date, kind }) => {
        const isToday = date === today;
        return (
          <li
            key={date}
            aria-label={`${formatWeekdayLong(date)}${isToday ? " (today)" : ""}: ${KIND_LABELS[kind]}`}
            className="flex flex-col items-center gap-1.5 md:gap-2"
          >
            <span aria-hidden="true" className="text-caption font-semibold text-[#C9CDE3]">
              <span className="md:hidden">{formatWeekdayLetter(date)}</span>
              <span className="hidden md:inline">{formatWeekdayShort(date)}</span>
            </span>
            <span aria-hidden="true" className="flex size-9 items-center justify-center md:size-11">
              <DayMark kind={kind} animate={isToday && justLit} />
            </span>
            <span aria-hidden="true" className="hidden text-caption font-normal text-[#C9CDE3] md:block">
              {isToday ? "Today" : dayOfMonth(date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DayMark({ kind, animate }: { kind: DayKind; animate: boolean }) {
  switch (kind) {
    case "lit":
      return (
        <span
          className={`inline-flex size-9 items-center justify-center rounded-pill bg-[#F2B544] text-[#2A2D3A] shadow-[0_0_0_4px_rgba(247,212,140,0.22)] md:size-11 md:shadow-[0_0_0_5px_rgba(247,212,140,0.22)] ${
            animate ? "light-up" : ""
          }`}
        >
          <SparkleIcon className="size-4 md:size-[18px]" />
        </span>
      );
    case "rest":
      return (
        <span className="inline-flex size-9 items-center justify-center rounded-pill bg-[#A9C9B2] text-[#2A2D3A] md:size-11">
          <Moon className="size-4 md:size-[18px]" strokeWidth={1.75} />
        </span>
      );
    case "today-pending":
      return (
        <span className="inline-flex size-8 items-center justify-center rounded-pill border-2 border-dashed border-[#F2B544] text-caption font-bold text-[#F2B544] md:size-10 md:text-body">
          +
        </span>
      );
    case "quiet":
      return <span className="size-[34px] rounded-pill bg-white/8 md:size-[42px]" />;
    case "future":
      return <span className="size-[34px] rounded-pill border border-[#C9CDE3]/35 md:size-[42px]" />;
  }
}
