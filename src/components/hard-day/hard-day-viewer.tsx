"use client";

import { useState } from "react";
import Link from "next/link";
import { WinTile } from "@/components/wins/win-tile";
import type { WinCategory } from "@/lib/categories";
import { BreathingExercise } from "./breathing-exercise";

type PastWin = {
  id: string;
  text: string;
  emoji: string | null;
  category: WinCategory;
  writtenOn: string;
};

/** One of the user's own past wins at a time, already shuffled on the server. */
export function HardDayViewer({ wins }: { wins: PastWin[] }) {
  const [index, setIndex] = useState(0);
  const [breathing, setBreathing] = useState(false);

  const breatheButton = (
    <button
      type="button"
      onClick={() => setBreathing(true)}
      className="inline-flex min-h-12 items-center justify-center rounded-md border border-on-dusk/40 px-6 text-label text-on-dusk transition-colors duration-200 hover:bg-on-dusk/10"
    >
      Breathe with me for a minute
    </button>
  );

  if (breathing) return <BreathingExercise onDone={() => setBreathing(false)} />;

  if (wins.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-8 text-center">
        <p className="max-w-md text-on-dusk/90">
          Your jar is still empty, and that&apos;s okay. Being here, looking after yourself, already counts.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {breatheButton}
          <Link
            href="/new"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-ink shadow-card"
          >
            Add a small win
          </Link>
        </div>
      </div>
    );
  }

  const win = wins[index];

  return (
    <div className="mt-8 flex flex-col gap-8">
      <figure key={win.id} className="hard-day-card">
        <WinTile text={win.text} emoji={win.emoji} category={win.category} />
        <figcaption className="mt-3 text-center text-label text-on-dusk/80">You, on {win.writtenOn}</figcaption>
      </figure>
      <p aria-live="polite" className="sr-only">
        Win {index + 1} of {wins.length}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {wins.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % wins.length)}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-ink shadow-card"
          >
            Show me another
          </button>
        )}
        {breatheButton}
      </div>
    </div>
  );
}
