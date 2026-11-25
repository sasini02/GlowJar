"use client";

import { useSearchParams } from "next/navigation";

/** Notes for people landing back on the welcome page: an expired link, or a just-deleted account. */
export function LinkErrorNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get("deleted") === "1") {
    return (
      <p role="status" className="mb-6 rounded-md bg-card-sky px-4 py-3 text-label text-ink">
        Your account and everything in it have been deleted. Thank you for the lights you collected here.
      </p>
    );
  }

  if (searchParams.get("error") !== "link") return null;

  return (
    <p role="alert" className="mb-6 rounded-md bg-card-blush px-4 py-3 text-label text-ink">
      That sign-in link has expired or was already used. Send yourself a fresh one below.
    </p>
  );
}
