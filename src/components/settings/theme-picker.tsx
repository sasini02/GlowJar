"use client";

import { useState, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { updateTheme } from "@/lib/actions/profile";
import { applyTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS = [
  { value: "day", label: "Day", icon: Sun },
  { value: "night", label: "Night", icon: Moon },
  { value: "auto", label: "Auto", icon: Monitor },
] as const;

/** Applies straight away on this device, then saves to the profile so other devices follow. */
export function ThemePicker({ initial }: { initial: ThemePreference }) {
  const [theme, setTheme] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function choose(next: ThemePreference) {
    setTheme(next);
    setError(null);
    applyTheme(next);
    startTransition(async () => {
      const result = await updateTheme(next);
      setError(result.error);
    });
  }

  return (
    <fieldset>
      <legend className="font-serif text-[20px] leading-[26px] font-semibold">Theme</legend>
      <p className="mt-0.5 text-label font-normal text-ink-muted">Auto follows your device&apos;s light or dark setting.</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-label text-ink transition-colors duration-200 has-checked:border-dusk has-checked:bg-card-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => choose(value)}
              className="sr-only"
            />
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-label text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
