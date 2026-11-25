"use client";

import { useState, useTransition } from "react";
import { resolveReports } from "@/lib/actions/reports";

export function ReportDecision({ winId }: { winId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "reviewed" | "removed") {
    setError(null);
    startTransition(async () => {
      const result = await resolveReports(winId, decision);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("reviewed")}
          className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-label text-ink disabled:opacity-60"
        >
          Keep it in the feed
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("removed")}
          className="inline-flex min-h-11 items-center rounded-md bg-danger px-4 text-label text-surface disabled:opacity-60"
        >
          Remove from the feed
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
