"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { readSeenDate, subscribeToSeen } from "./note-seen";

/** The bell in Home's header, with a small dot while today's glow note is unread. */
export function NotificationBell({ today }: { today: string }) {
  // On the server (and the first client render) there's no device storage, so no dot.
  const seen = useSyncExternalStore(subscribeToSeen, readSeenDate, () => today);
  const unread = seen !== today;

  return (
    <Link
      href="/notifications"
      aria-label={unread ? "Notifications, today's note is new" : "Notifications"}
      className="relative inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-raised text-ink"
    >
      <Bell className="size-5" strokeWidth={1.75} aria-hidden="true" />
      {unread && (
        <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2.5 rounded-pill bg-glow-ink ring-2 ring-surface-raised" />
      )}
    </Link>
  );
}
