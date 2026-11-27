import { CalendarHeart } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { OnThisDayWin } from "@/lib/jar/queries";

export function howLongAgo(monthsAgo: number): string {
  if (monthsAgo === 3) return "About three months ago";
  if (monthsAgo === 6) return "About six months ago";
  if (monthsAgo === 12) return "A year ago";
  return `${monthsAgo / 12} years ago`;
}

/** One of the viewer's own wins from about this date, three months or more ago. */
export function OnThisDayCard({ win, className = "" }: { win: OnThisDayWin; className?: string }) {
  return (
    <section
      aria-label="On this day"
      className={`break-inside-avoid rounded-lg border border-line bg-surface-raised p-7 shadow-card ${className}`}
    >
      <p className="inline-flex items-center gap-2 text-label text-ink-muted">
        <CalendarHeart className="size-4" strokeWidth={1.75} aria-hidden="true" />
        On this day · {howLongAgo(win.monthsAgo)}
      </p>
      <div className={`mt-4 rounded-md p-5 ${CATEGORIES[win.category].tint}`}>
        {win.emoji && <p className="mb-2 text-win-emoji">{win.emoji}</p>}
        <p className="font-serif text-win-text break-words whitespace-pre-line text-ink">{win.text}</p>
      </div>
      <p className="mt-4 text-label text-ink-muted">Look how far you&apos;ve come.</p>
    </section>
  );
}
