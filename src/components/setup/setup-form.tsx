"use client";

import { useActionState, useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { CheerupsSwitch } from "@/components/push/cheerups-switch";
import { completeSetup, suggestUsername, type SetupState } from "@/lib/actions/profile";
import { NUDGE_OPTIONS } from "@/lib/nudge";
import type { Enums } from "@/lib/supabase/database.types";

const initialState: SetupState = { error: null };

type SetupFormProps = {
  initialUsername: string;
  initialNudgeTime: Enums<"nudge_time">;
  initialCheerupsEnabled: boolean;
};

export function SetupForm({ initialUsername, initialNudgeTime, initialCheerupsEnabled }: SetupFormProps) {
  const [state, formAction, saving] = useActionState(completeSetup, initialState);
  const [username, setUsername] = useState(initialUsername);
  const [shuffling, startShuffle] = useTransition();

  function shuffle() {
    startShuffle(async () => {
      const suggestion = await suggestUsername();
      if (suggestion) setUsername(suggestion);
    });
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
        <CheerupsSwitch initialEnabled={initialCheerupsEnabled} />
      </section>

      {state.error && (
        <p role="alert" className="text-label text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card transition-shadow duration-200 hover:shadow-lift disabled:opacity-70"
      >
        {saving ? "Starting…" : "Start my jar"}
      </button>
    </form>
  );
}
