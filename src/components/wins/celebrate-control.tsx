"use client";

import { useCallback, useRef, useState, useTransition, type CSSProperties } from "react";
import { setCelebration } from "@/lib/actions/celebrations";
import { CELEBRATION_ORDER, CELEBRATIONS, type CelebrationType } from "@/lib/celebrations";
import { useDismiss } from "@/components/ui/use-dismiss";

// Where each coral spark drifts to, relative to the button's centre.
const SPARKS = [
  { x: "-26px", y: "-18px", delay: "0ms" },
  { x: "24px", y: "-20px", delay: "40ms" },
  { x: "-20px", y: "16px", delay: "80ms" },
  { x: "28px", y: "14px", delay: "20ms" },
];

type CelebrateControlProps = {
  winId: string;
  initial: CelebrationType | null;
  /** Classes that hide the control until the card is hovered, focused or tapped. */
  hiddenUntilRevealed: string;
};

export function CelebrateControl({ winId, initial, hiddenUntilRevealed }: CelebrateControlProps) {
  const [current, setCurrent] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped on each new celebration; used as a key so the pop and sparks replay.
  const [burst, setBurst] = useState(0);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  function choose(type: CelebrationType | null) {
    const previous = current;
    setCurrent(type);
    if (type && type !== previous) setBurst((count) => count + 1);
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await setCelebration(winId, type);
      if (result.error) {
        setCurrent(previous);
        setError(result.error);
      }
    });
  }

  const visible = current !== null || open;

  return (
    <div ref={containerRef} className={`relative ${visible ? "" : hiddenUntilRevealed}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-pill px-4 text-label shadow-card transition-colors duration-200 ${
          current ? "bg-glow text-on-glow" : "bg-surface-raised text-ink hover:bg-surface"
        }`}
      >
        {current ? (
          <span key={burst} className={`inline-flex items-center gap-1.5 ${burst ? "celebrate-pop" : ""}`}>
            <span aria-hidden="true">{CELEBRATIONS[current].emoji}</span> Celebrated
          </span>
        ) : (
          "Celebrate"
        )}
      </button>

      {burst > 0 && current && (
        <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {SPARKS.map((spark, index) => (
            <span
              key={index}
              className="celebrate-spark"
              style={
                { "--spark-x": spark.x, "--spark-y": spark.y, animationDelay: spark.delay } as CSSProperties
              }
            />
          ))}
        </span>
      )}

      {open && (
        <div
          role="menu"
          aria-label="Celebrate this win"
          className="absolute top-full right-0 z-20 mt-2 flex w-48 flex-col rounded-md bg-surface-raised p-1.5 shadow-lift"
        >
          {CELEBRATION_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              role="menuitemradio"
              aria-checked={current === type}
              onClick={() => choose(type)}
              className={`flex min-h-11 items-center gap-3 rounded-sm px-3 text-left text-label text-ink transition-colors duration-200 hover:bg-surface ${
                current === type ? "bg-surface" : ""
              }`}
            >
              <span aria-hidden="true" className="text-body">
                {CELEBRATIONS[type].emoji}
              </span>
              {CELEBRATIONS[type].label}
            </button>
          ))}
          {current && (
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(null)}
              className="mt-1 flex min-h-11 items-center rounded-sm border-t border-line px-3 text-left text-label text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              Take it back
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="absolute top-full right-0 mt-2 w-48 rounded-sm bg-surface-raised p-2 text-caption text-danger shadow-card">
          {error}
        </p>
      )}
    </div>
  );
}
