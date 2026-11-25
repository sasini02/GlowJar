"use client";

import { useSearchParams } from "next/navigation";

/** Shown when someone lands back on the welcome page from an expired or already-used link. */
export function LinkErrorNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("error") !== "link") return null;

  return (
    <p role="alert" className="mb-6 rounded-md bg-card-blush px-4 py-3 text-label text-ink">
      That sign-in link has expired or was already used. Send yourself a fresh one below.
    </p>
  );
}
