import Link from "next/link";
import { CATEGORIES, CATEGORY_ORDER, type WinCategory } from "@/lib/categories";

/** Plain grey words; the active one sits in a dark pill. */
export function CategoryFilters({ active }: { active: WinCategory | null }) {
  const options: { href: string; label: string; value: WinCategory | null }[] = [
    { href: "/feed", label: "All", value: null },
    ...CATEGORY_ORDER.map((value) => ({ href: `/feed?category=${value}`, label: CATEGORIES[value].label, value })),
  ];

  return (
    <nav aria-label="Filter by category" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <ul className="flex gap-1">
        {options.map((option) => {
          const isActive = option.value === active;
          return (
            <li key={option.label} className="shrink-0">
              <Link
                href={option.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-pill px-4 text-label transition-colors duration-200 ${
                  isActive ? "bg-ink text-surface" : "text-ink-muted hover:text-ink"
                }`}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
