"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { feedItem, homeItem, ICON_STROKE, isActive, jarItem, moodItem, type NavItem } from "@/components/shell/nav-items";

/** Floating tab bar on phones: Home, Feed, a raised Add win button, Mood and My jar. */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 h-18 rounded-[28px] bg-surface-raised shadow-lift md:hidden"
    >
      <Suspense fallback={<TabList pathname={null} />}>
        <ActiveTabList />
      </Suspense>
    </nav>
  );
}

function ActiveTabList() {
  const pathname = usePathname();
  return <TabList pathname={pathname} />;
}

/** Rendered without a pathname while the URL is still unknown during prerendering. */
function TabList({ pathname }: { pathname: string | null }) {
  const active = (item: NavItem) => pathname !== null && isActive(pathname, item.href);
  return (
    <ul className="mx-auto grid h-full max-w-md grid-cols-5 items-center">
      <Tab item={homeItem} active={active(homeItem)} />
      <Tab item={feedItem} active={active(feedItem)} />
      <li className="flex justify-center">
        <Link
          href="/new"
          aria-label="Add a win"
          className="-mt-6 inline-flex size-14 items-center justify-center rounded-pill bg-[#F2B544] text-[#2A2D3A] shadow-[0_6px_16px_rgba(242,181,68,0.45)] transition-transform duration-200 active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </li>
      <Tab item={moodItem} active={active(moodItem)} />
      <Tab item={jarItem} active={active(jarItem)} />
    </ul>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li className="flex justify-center">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-4 transition-colors duration-200 ${
          active ? "font-bold text-ink" : "font-semibold text-ink-muted"
        }`}
      >
        <span
          className={`inline-flex h-[30px] w-11 items-center justify-center rounded-pill transition-colors duration-200 ${
            active ? item.activeTint : ""
          }`}
        >
          <Icon className="size-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
        </span>
        {item.label}
      </Link>
    </li>
  );
}
