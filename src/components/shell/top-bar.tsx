"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleUserRound, Moon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { desktopNav, ICON_STROKE, isActive } from "./nav-items";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-surface/90 backdrop-blur md:block">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center gap-8 px-8">
        <Logo />

        <Suspense fallback={<DesktopNavLinks pathname={null} />}>
          <DesktopNav />
        </Suspense>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/hard-day"
            className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-dusk px-4 text-label text-on-dusk transition-opacity duration-200 hover:opacity-90"
          >
            <Moon className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
            Hard day
          </Link>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="inline-flex size-11 items-center justify-center rounded-pill text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            <Bell className="size-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
          </Link>
          <Link
            href="/settings"
            aria-label="You and settings"
            className="inline-flex size-11 items-center justify-center rounded-pill text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            <CircleUserRound className="size-6" strokeWidth={ICON_STROKE} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function DesktopNav() {
  const pathname = usePathname();
  return <DesktopNavLinks pathname={pathname} />;
}

/** Rendered without a pathname while the URL is still unknown during prerendering. */
function DesktopNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {desktopNav.map((item) => {
        const active = pathname !== null && isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-pill px-4 text-label transition-colors duration-200 ${
              active ? "bg-ink text-surface" : "text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
