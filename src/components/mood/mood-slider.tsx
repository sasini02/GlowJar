"use client";

import { useId } from "react";
import { MOOD_LEVELS, moodStyle, type MoodLevel } from "@/lib/mood";

type MoodSliderProps = {
  value: MoodLevel;
  onChange: (level: MoodLevel) => void;
  /** The seven tick dots under the track (the full check-in screen). */
  ticks?: boolean;
};

/** A native 0–6 range input on the shared mood scale, with end labels. */
export function MoodSlider({ value, onChange, ticks = false }: MoodSliderProps) {
  const id = useId();
  return (
    <div className={`flex flex-col ${ticks ? "gap-2" : "gap-1.5"}`}>
      <label htmlFor={id} className="sr-only">
        Mood, from very unpleasant to very pleasant
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={6}
        step={1}
        value={value}
        aria-valuetext={moodStyle(value).label}
        onChange={(event) => onChange(Number(event.target.value) as MoodLevel)}
        className="mood-range"
      />
      {ticks && (
        <div aria-hidden="true" className="flex justify-between px-[18px]">
          {MOOD_LEVELS.map(({ level }) => (
            <span key={level} className="size-1 rounded-pill bg-[#BDB5A8]" />
          ))}
        </div>
      )}
      <div aria-hidden="true" className="flex justify-between text-[11px] leading-4 font-semibold tracking-[0.06em] text-ink-muted uppercase">
        <span>Very unpleasant</span>
        <span>Very pleasant</span>
      </div>
    </div>
  );
}
