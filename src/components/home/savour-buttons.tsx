"use client";

import { useState } from "react";

const OPTIONS = [
  { emoji: "🙂", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥹", label: "Moved" },
];

/** "How does this feel now?" A moment to savour an old win. Nothing is stored. */
export function SavourButtons() {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3 md:mt-auto">
      <p className="text-[13px] leading-[18px] text-ink-muted-tint">
        {chosen ? "Thanks for taking a moment with it." : "How does this feel now?"}
      </p>
      <div role="group" aria-label="How does this feel now?" className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-label={option.label}
            aria-pressed={chosen === option.label}
            onClick={() => setChosen(option.label)}
            className={`inline-flex h-11 w-12 items-center justify-center rounded-pill bg-surface-raised text-[20px] transition-transform duration-200 hover:scale-105 ${
              chosen === option.label ? "ring-2 ring-ink" : ""
            }`}
          >
            {option.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
