"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { feedItem, ICON_STROKE, isActive, jarItem, lettersItem, youItem, type NavItem } from "./nav-items";

export function BottomTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
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
  return (
    <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
      <Tab item={feedItem} active={pathname !== null && isActive(pathname, feedItem.href)} />
      <Tab item={jarItem} active={pathname !== null && isActive(pathname, jarItem.href)} />
      <li className="flex justify-center">
        <Link
          href="/new"
          aria-label="Add a win"
          className="inline-flex size-13 items-center justify-center rounded-pill bg-glow text-on-glow shadow-card transition-transform duration-200 active:scale-95"
        >
          <Plus className="size-6" strokeWidth={ICON_STROKE} aria-hidden="true" />
        </Link>
      </li>
      <Tab item={lettersItem} active={pathname !== null && isActive(pathname, lettersItem.href)} />
      <Tab item={youItem} active={pathname !== null && isActive(pathname, youItem.href)} />
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
        className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-2 text-caption transition-colors duration-200 ${
          active ? "text-ink" : "text-ink-muted"
        }`}
      >
        <Icon className="size-6" strokeWidth={ICON_STROKE} aria-hidden="true" />
        {item.label}
      </Link>
    </li>
  );
}
