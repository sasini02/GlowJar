"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/lib/actions/profile";

const TRIED_KEY = "glowjar:timezone-synced";

/** Updates the saved timezone when this device's differs, e.g. after travelling or a set-up on another device. */
export function TimezoneSync({ saved }: { saved: string }) {
  useEffect(() => {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!device || device === saved) return;

    // Once per tab session, so a name the database refuses can't cause a loop of retries.
    try {
      if (sessionStorage.getItem(TRIED_KEY) === device) return;
      sessionStorage.setItem(TRIED_KEY, device);
    } catch {
      // No session storage: still try once for this page view.
    }
    void syncTimezone(device);
  }, [saved]);

  return null;
}
