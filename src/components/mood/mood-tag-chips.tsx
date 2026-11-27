"use client";

import { MOOD_TAGS, type MoodTag } from "@/lib/mood";

type MoodTagChipsProps = {
  selected: MoodTag[];
  onToggle: (tag: MoodTag) => void;
  labelledBy: string;
  size?: "regular" | "small";
  centered?: boolean;
};

/** Optional "what's shaping it" toggles for a check-in. The pills are drawn small but each tap area is 44px tall. */
export function MoodTagChips({ selected, onToggle, labelledBy, size = "regular", centered = false }: MoodTagChipsProps) {
  const small = size === "small";
  return (
    <div role="group" aria-labelledby={labelledBy} className={`flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}>
      {MOOD_TAGS.map((tag) => {
        const on = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(tag)}
            className={`${small ? "-my-1 py-1" : "-my-[3px] py-[3px]"} rounded-pill`}
          >
            <span
              className={`inline-flex items-center rounded-pill px-3.5 font-semibold transition-colors duration-200 ${
                small ? "h-9 text-[13px]" : "h-[38px] text-label"
              } ${on ? "bg-ink text-surface" : "border border-line bg-surface-raised text-ink"}`}
            >
              {tag}
            </span>
          </button>
        );
      })}
    </div>
  );
}
