"use client";

import { useActionState, useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { completeSetup, suggestUsername, type SetupState } from "@/lib/actions/profile";
import type { Enums } from "@/lib/supabase/database.types";

const NUDGE_OPTIONS: { value: Enums<"nudge_time">; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "Around 8:00" },
  { value: "lunch", label: "Lunch break", hint: "Around 12:30" },
  { value: "evening", label: "After dinner", hint: "Around 19:30" },
  { value: "night", label: "Before bed", hint: "Around 21:30" },
];

const initialState: SetupState = { error: null };

type SetupFormProps = {
  initialUsername: string;
  initialNudgeTime: Enums<"nudge_time">;
};

export function SetupForm({ initialUsername, initialNudgeTime }: SetupFormProps) {
  const [state, formAction, saving] = useActionState(completeSetup, initialState);
  const [username, setUsername] = useState(initialUsername);
  const [shuffling, startShuffle] = useTransition();
  const [cheerups, setCheerups] = useState(false);
  const [notificationNote, setNotificationNote] = useState<string | null>(null);

  function shuffle() {
    startShuffle(async () => {
      const suggestion = await suggestUsername();
      if (suggestion) setUsername(suggestion);
    });
  }

  async function toggleCheerups(next: boolean) {
    setNotificationNote(null);
    if (!next) {
      setCheerups(false);
      return;
    }
    if (!("Notification" in window)) {
      setNotificationNote("This browser can't show notifications. You can still turn cheer-ups on later from your phone.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setCheerups(true);
    } else {
      setNotificationNote("Notifications are off for Glowjar. You can allow them in your browser settings any time.");
    }
  }

  function submit(formData: FormData) {
    formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    formAction(formData);
  }

  return (
    <form action={submit} className="flex flex-col gap-10">
      <section>
        <label htmlFor="username" className="font-serif text-title">
          What should we call you?
        </label>
        <p className="mt-1 text-ink-muted">This is the only name anyone else sees. You can change it later.</p>
        <div className="mt-4 flex gap-2">
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={3}
            maxLength={32}
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-sm border border-line bg-surface-raised px-4 text-body text-ink"
          />
          <button
            type="button"
            onClick={shuffle}
            disabled={shuffling}
            className="inline-flex min-h-12 items-center gap-2 rounded-md border border-line bg-surface-raised px-4 text-label text-ink transition-colors duration-200 hover:bg-surface disabled:opacity-70"
          >
            <Shuffle className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Shuffle
          </button>
        </div>
      </section>

      <fieldset>
        <legend className="font-serif text-title">When should we nudge you?</legend>
        <p className="mt-1 text-ink-muted">One gentle reminder a day to notice something that went right.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {NUDGE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-16 cursor-pointer flex-col justify-center rounded-md border border-line bg-surface-raised px-4 py-3 transition-colors duration-200 has-checked:border-dusk has-checked:bg-card-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring"
            >
              <input
                type="radio"
                name="nudge_time"
                value={option.value}
                defaultChecked={option.value === initialNudgeTime}
                className="sr-only"
              />
              <span className="text-label text-ink">{option.label}</span>
              <span className="text-caption text-ink-muted">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section>
        <div className="flex items-start justify-between gap-4 rounded-md border border-line bg-surface-raised p-4">
          <div>
            <p id="cheerups-label" className="text-label text-ink">
              Weekly cheer-ups
            </p>
            <p id="cheerups-hint" className="mt-1 text-caption text-ink-muted">
              Once a week we send back one of your own past wins, at a quiet, random moment.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={cheerups}
            aria-labelledby="cheerups-label"
            aria-describedby="cheerups-hint"
            onClick={() => toggleCheerups(!cheerups)}
            className={`relative inline-flex h-8 w-13 shrink-0 items-center rounded-pill transition-colors duration-200 ${
              cheerups ? "bg-dusk" : "bg-line"
            }`}
          >
            <span
              className={`inline-block size-6 rounded-pill bg-surface-raised shadow-card transition-transform duration-200 ${
                cheerups ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {cheerups && <input type="hidden" name="cheerups_enabled" value="on" />}
        {notificationNote && <p className="mt-2 text-caption text-ink-muted">{notificationNote}</p>}
      </section>

      {state.error && (
        <p role="alert" className="text-label text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-ink shadow-card transition-shadow duration-200 hover:shadow-lift disabled:opacity-70"
      >
        {saving ? "Starting…" : "Start my jar"}
      </button>
    </form>
  );
}
