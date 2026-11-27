"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { saveMood } from "@/lib/actions/mood";
import { MOOD_LEVELS, moodStyle, type MoodLevel } from "@/lib/mood";
import { timeOfDayPhrase, type TimeOfDay } from "@/lib/time";
import { MoodOrb } from "./mood-orb";

type MoodQuickPickProps = {
  /** Today's saved mood, if there is one. */
  initialLevel: MoodLevel | null;
  moment: TimeOfDay;
};

/** One-tap mood check-in on Home. A card on phones, a full-width strip on wider screens. */
export function MoodQuickPick({ initialLevel, moment }: MoodQuickPickProps) {
  const [saved, setSaved] = useState(initialLevel);
  const [shown, showOptimistic] = useOptimistic(saved);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const when = timeOfDayPhrase(moment);

  function pick(level: MoodLevel) {
    setError(null);
    startTransition(async () => {
      showOptimistic(level);
      const result = await saveMood(level);
      if (result.error) setError(result.error);
      else setSaved(level);
    });
  }

  // A plain render helper (not a component), so the buttons keep their identity between renders.
  function orbs(size: number, className: string) {
    return (
      <div role="group" aria-label="Pick your mood" className={className}>
        {MOOD_LEVELS.map(({ level, label }) => (
          <button
            key={level}
            type="button"
            aria-label={label}
            aria-pressed={shown === level}
            title={label}
            onClick={() => pick(level)}
            className={`inline-flex shrink-0 items-center justify-center rounded-pill border-2 transition-transform duration-200 hover:scale-105 ${
              shown === level ? "border-ink" : "border-transparent"
            }`}
          >
            <MoodOrb level={level} size={size - 4} compact />
          </button>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Mood check-in">
      {/* Phones */}
      <div className="flex flex-col gap-3.5 rounded-[24px] bg-surface-raised px-4 py-[18px] shadow-card md:hidden">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-[19px] leading-6 font-semibold">
            How are you feeling?
          </h2>
          <Link href="/mood" className="text-[13px] font-semibold whitespace-nowrap text-glow-ink hover:underline">
            Mood board
          </Link>
        </div>
        {orbs(44, "flex justify-between")}
        {error ? (
          <p role="alert" className="text-label text-danger">
            {error}
          </p>
        ) : shown === null ? (
          <div
            aria-hidden="true"
            className="flex justify-between text-[11px] leading-4 font-semibold tracking-[0.06em] text-ink-muted uppercase"
          >
            <span>Very unpleasant</span>
            <span>Very pleasant</span>
          </div>
        ) : (
          <div role="status" className="flex items-center justify-between gap-2 rounded-[14px] bg-surface px-3 py-2.5">
            <span className="text-label font-normal">
              <span className="font-bold">{moodStyle(shown).label}</span> saved for {when}.
            </span>
            <Link
              href="/mood/check-in?from=/home"
              className="inline-flex min-h-11 items-center text-[13px] font-semibold whitespace-nowrap text-glow-ink hover:underline"
            >
              Add details
            </Link>
          </div>
        )}
      </div>

      {/* Tablets and desktops */}
      <div className="hidden flex-wrap items-center gap-x-7 gap-y-4 rounded-[28px] bg-surface-raised px-6 py-5 shadow-card md:flex">
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <h2 className="font-serif text-[22px] leading-7 font-semibold">How are you feeling {when}?</h2>
          {error ? (
            <p role="alert" className="text-label text-danger">
              {error}
            </p>
          ) : shown === null ? (
            <p className="text-label font-normal text-ink-muted">One tap. Only you can see it.</p>
          ) : (
            <p role="status" className="text-label font-semibold text-sage-ink">
              {moodStyle(shown).label} saved for {when}.{" "}
              <Link href="/mood/check-in?from=/home" className="text-glow-ink underline underline-offset-4">
                Add details
              </Link>
            </p>
          )}
        </div>
        {orbs(52, "flex flex-wrap gap-2.5")}
        <Link
          href="/mood"
          className="inline-flex h-11 items-center gap-1.5 rounded-pill border border-line px-4 text-label font-semibold text-ink transition-colors duration-200 hover:bg-surface"
        >
          Mood board
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
