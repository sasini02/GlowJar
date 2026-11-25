"use client";

import { useState } from "react";

type FeelingCheckProps = {
  question: string;
  options: { emoji: string; label: string }[];
  thanks: string;
  /** Classes for the text, so it reads on cream or indigo backgrounds. */
  tone?: "surface" | "dusk";
};

/** A light-touch "how does this feel?" row. Nothing is stored; it's a moment to notice. */
export function FeelingCheck({ question, options, thanks, tone = "surface" }: FeelingCheckProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const muted = tone === "dusk" ? "text-on-dusk/80" : "text-ink-muted";

  return (
    <div>
      <p className={`text-label ${tone === "dusk" ? "text-on-dusk" : "text-ink"}`}>{question}</p>
      <div className="mt-3 flex gap-3" role="group" aria-label={question}>
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={chosen === option.label}
            aria-label={option.label}
            onClick={() => setChosen(option.label)}
            className={`inline-flex size-13 items-center justify-center rounded-pill text-title transition-transform duration-200 hover:scale-105 ${
              chosen === option.label ? "bg-glow ring-2 ring-dusk" : tone === "dusk" ? "bg-on-dusk/15" : "bg-surface-raised shadow-card"
            }`}
          >
            {option.emoji}
          </button>
        ))}
      </div>
      <p role="status" className={`mt-3 min-h-5 text-label ${muted}`}>
        {chosen ? thanks : ""}
      </p>
    </div>
  );
}
