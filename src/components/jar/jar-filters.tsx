import Link from "next/link";
import { Search } from "lucide-react";
import type { JarVisibility } from "@/lib/wins/queries";

const OPTIONS: { value: JarVisibility; label: string }[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

function jarHref(visibility: JarVisibility, search: string) {
  const params = new URLSearchParams();
  if (visibility !== "all") params.set("show", visibility);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? `/jar?${query}` : "/jar";
}

/** All / Public / Private plus search. A plain GET form, so it works before JavaScript loads. */
export function JarFilters({ visibility, search }: { visibility: JarVisibility; search: string }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <nav aria-label="Filter your wins">
        <ul className="flex gap-1">
          {OPTIONS.map((option) => {
            const active = option.value === visibility;
            return (
              <li key={option.value}>
                <Link
                  href={jarHref(option.value, search)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-pill px-4 text-label transition-colors duration-200 ${
                    active ? "bg-ink text-surface" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {option.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/jar" role="search" className="relative w-full md:max-w-xs">
        {visibility !== "all" && <input type="hidden" name="show" value={visibility} />}
        <label htmlFor="jar-search" className="sr-only">
          Search your wins
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id="jar-search"
          type="search"
          name="q"
          defaultValue={search}
          maxLength={100}
          placeholder="Search your wins"
          className="min-h-12 w-full rounded-pill border border-line bg-surface-raised pr-4 pl-11 text-body text-ink placeholder:text-ink-muted"
        />
      </form>
    </div>
  );
}
