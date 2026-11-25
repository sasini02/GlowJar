"use client";

import { useEffect, useState } from "react";

// Breathe in for 4 seconds, out for 6: six slow breaths make one minute.
const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const TOTAL_BREATHS = 6;

export function BreathingExercise({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [breaths, setBreaths] = useState(0);
  const finished = breaths >= TOTAL_BREATHS;

  useEffect(() => {
    if (finished) return;
    const timer = window.setTimeout(
      () => {
        if (phase === "in") {
          setPhase("out");
        } else {
          setPhase("in");
          setBreaths((count) => count + 1);
        }
      },
      phase === "in" ? INHALE_MS : EXHALE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase, finished]);

  return (
    <div className="mt-10 flex flex-col items-center gap-10 text-center">
      <div className="relative flex size-56 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-pill bg-glow-soft/30 transition-transform ease-in-out"
          style={{
            transform: `scale(${finished || phase === "out" ? 0.55 : 1})`,
            transitionDuration: `${phase === "in" ? INHALE_MS : EXHALE_MS}ms`,
          }}
        />
        <span aria-hidden="true" className="absolute inset-[38%] rounded-pill bg-glow" />
      </div>

      <div aria-live="polite">
        <p className="font-serif text-title">
          {finished ? "That was a minute. Well done." : phase === "in" ? "Breathe in" : "Breathe out"}
        </p>
        {!finished && (
          <p className="mt-2 text-label text-on-dusk/80">
            Breath {Math.min(breaths + 1, TOTAL_BREATHS)} of {TOTAL_BREATHS}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="inline-flex min-h-12 items-center justify-center rounded-md border border-on-dusk/40 px-6 text-label text-on-dusk transition-colors duration-200 hover:bg-on-dusk/10"
      >
        {finished ? "Back to my wins" : "Stop"}
      </button>
    </div>
  );
}
