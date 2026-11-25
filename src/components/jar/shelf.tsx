import Link from "next/link";
import { JarMark } from "@/components/brand/jar-mark";
import { formatMonth, formatShortMonth } from "@/lib/dates";
import type { ShelfMonth } from "@/lib/jar/queries";

/** Past months as small jars. Each opens that month's recap. */
export function Shelf({ months }: { months: ShelfMonth[] }) {
  if (!months.length) {
    return <p className="text-ink-muted">When this month ends, its jar will rest here on the shelf.</p>;
  }

  return (
    <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] md:mx-0 md:px-0">
      {months.map(({ month, lights }) => (
        <li key={month} className="shrink-0">
          <Link
            href={`/jar/recap/${month.slice(0, 7)}`}
            aria-label={`${formatMonth(month, { withYear: true })}: ${lights} ${lights === 1 ? "light" : "lights"}. Open the recap.`}
            className="flex w-24 flex-col items-center gap-2 rounded-md border border-line bg-surface-raised px-3 py-4 text-center transition-shadow duration-200 hover:shadow-card"
          >
            <JarMark className="size-9 text-glow-ink" />
            <span className="font-serif text-title">{lights}</span>
            <span className="text-caption text-ink-muted">{formatShortMonth(month)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
