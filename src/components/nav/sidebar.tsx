"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ICON_STROKE, isActive, sidebarNav } from "@/components/shell/nav-items";

type SidebarProps = {
  /** Shown under the links on Home: today's lights from everyone. */
  homeCard: ReactNode;
};

/**
 * Navigation on tablets and desktops. A left column on wide screens; on
 * narrower ones it stacks above the content as a row of links. Notifications
 * and settings live in Home's header (and My jar's), as in the design.
 */
export function Sidebar({ homeCard }: SidebarProps) {
  return (
    <aside className="hidden md:block lg:sticky lg:top-0 lg:h-dvh lg:w-[220px] lg:shrink-0">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-8 py-4 lg:h-full lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-7 lg:px-5 lg:py-7">
        <div className="lg:px-2">
          <Logo />
        </div>
        <Suspense fallback={<SidebarBody pathname={null} homeCard={null} />}>
          <ActiveSidebarBody homeCard={homeCard} />
        </Suspense>
      </div>
    </aside>
  );
}

function ActiveSidebarBody({ homeCard }: SidebarProps) {
  const pathname = usePathname();
  return <SidebarBody pathname={pathname} homeCard={homeCard} />;
}

/** Rendered without a pathname while the URL is still unknown during prerendering. */
function SidebarBody({ pathname, homeCard }: { pathname: string | null; homeCard: ReactNode }) {
  return (
    <>
      <nav aria-label="Main">
        <ul className="flex flex-wrap gap-1 lg:flex-col">
          {sidebarNav.map((item) => {
            const active = pathname !== null && isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-md px-3.5 text-[15px] transition-colors duration-200 ${
                    active ? `${item.activeTint} font-bold text-ink` : "font-semibold text-ink-muted-tint hover:bg-surface-raised hover:text-ink"
                  }`}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {pathname === "/home" && <div className="hidden lg:block">{homeCard}</div>}
      {pathname !== null && isActive(pathname, "/mood") && (
        <div className="hidden items-center gap-2.5 rounded-[20px] bg-surface-raised p-4 shadow-card lg:flex">
          <Lock className="size-[18px] shrink-0 text-sage-ink" strokeWidth={ICON_STROKE} aria-hidden="true" />
          <p className="text-[13px] leading-[18px] text-ink-muted-tint">Your moods are private. Only you see them.</p>
        </div>
      )}
    </>
  );
}
