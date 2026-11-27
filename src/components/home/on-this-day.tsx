import type { OnThisDayWin } from "@/lib/jar/queries";
import { SavourButtons } from "./savour-buttons";

function ago(monthsAgo: number): string {
  if (monthsAgo < 12) return `${monthsAgo} months ago`;
  const years = monthsAgo / 12;
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/** A past win of the viewer's own from about this date, with a moment to savour it. */
export function HomeOnThisDay({ win }: { win: OnThisDayWin }) {
  return (
    <section
      aria-label="On this day"
      className="flex h-full flex-col gap-3 rounded-[24px] bg-card-sky p-5 md:rounded-[28px] md:p-6"
    >
      <p className="text-caption font-semibold tracking-[0.04em] text-dusk-ink uppercase">On this day · {ago(win.monthsAgo)}</p>
      <p className="font-serif text-[19px] leading-7 break-words whitespace-pre-line text-ink">
        {win.emoji && <span aria-hidden="true">{win.emoji} </span>}
        {win.text}
      </p>
      <SavourButtons />
    </section>
  );
}
