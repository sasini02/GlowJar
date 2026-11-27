"use client";

import { useEffect } from "react";
import { markSeen } from "./note-seen";

/** Clears the bell's unread dot once today's note has been shown. Renders nothing. */
export function MarkNoteSeen({ today }: { today: string }) {
  useEffect(() => {
    markSeen(today);
  }, [today]);
  return null;
}
