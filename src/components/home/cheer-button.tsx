"use client";

import { useState, useTransition } from "react";
import { setCelebration } from "@/lib/actions/celebrations";

/** A one-tap 🎉 for someone else's win. The pill is small; the tap area is a full 44px. */
export function CheerButton({ winId }: { winId: string }) {
  const [celebrated, setCelebrated] = useState(false);
  const [, startTransition] = useTransition();

  function celebrate() {
    setCelebrated(true);
    startTransition(async () => {
      const result = await setCelebration(winId, "celebrate");
      if (result.error) setCelebrated(false);
    });
  }

  return (
    <button
      type="button"
      onClick={celebrate}
      disabled={celebrated}
      aria-label={celebrated ? "Celebrated" : "Celebrate this win"}
      className="-m-1.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center p-1.5"
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-8 items-center rounded-pill px-2.5 text-[13px] md:h-[34px] md:px-3 md:text-label ${
          celebrated ? "celebrate-pop bg-[#F2B544]" : "bg-surface-raised"
        }`}
      >
        🎉
      </span>
    </button>
  );
}
