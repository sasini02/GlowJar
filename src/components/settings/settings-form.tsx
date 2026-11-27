"use client";

import { useActionState, useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { suggestUsername, updateSettings, type SettingsState } from "@/lib/actions/profile";
import { NUDGE_OPTIONS } from "@/lib/nudge";
import type { Enums } from "@/lib/supabase/database.types";

const initialState: SettingsState = { status: "idle", message: null };

type SettingsFormProps = {
  username: string;
  nudgeTime: Enums<"nudge_time">;
  glowReminders: boolean;
  quietStart: string;
  quietEnd: string;
  defaultVisibility: Enums<"visibility">;
  timezone: string;
};

const sectionTitle = "font-serif text-title";
const optionCard =
  "flex min-h-14 cursor-pointer flex-col justify-center rounded-md border border-line bg-surface-raised px-4 py-3 transition-colors duration-200 has-checked:border-dusk has-checked:bg-card-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring";

export function SettingsForm({
  username: initialUsername,
  nudgeTime,
  glowReminders,
  quietStart,
  quietEnd,
  defaultVisibility,
  timezone,
}: SettingsFormProps) {
  const [state, formAction, saving] = useActionState(updateSettings, initialState);
  const [username, setUsername] = useState(initialUsername);
  const [shuffling, startShuffle] = useTransition();

  function shuffle() {
    startShuffle(async () => {
      const suggestion = await suggestUsername();
      if (suggestion) setUsername(suggestion);
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <section>
        <label htmlFor="settings-username" className={sectionTitle}>
          Your name
        </label>
        <p className="mt-1 text-ink-muted">The only thing anyone else ever sees.</p>
        <div className="mt-4 flex gap-2">
          <input
            id="settings-username"
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
        <legend className={sectionTitle}>Daily nudge</legend>
        <p className="mt-1 text-ink-muted">
          One gentle reminder, only on days you haven&apos;t added a win yet, and never at night.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {NUDGE_OPTIONS.map((option) => (
            <label key={option.value} className={optionCard}>
              <input
                type="radio"
                name="nudge_time"
                value={option.value}
                defaultChecked={option.value === nudgeTime}
                className="sr-only"
              />
              <span className="text-label text-ink">{option.label}</span>
              <span className="text-caption text-ink-muted">{option.hint}</span>
            </label>
          ))}
        </div>
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-label text-ink">
          <input
            type="checkbox"
            name="glow_reminders"
            defaultChecked={glowReminders}
            className="size-5 accent-[var(--color-dusk)]"
          />
          Send it as a notification
        </label>
        <p className="text-caption text-ink-muted">Notifications arrive once you turn them on with weekly cheer-ups below.</p>
      </fieldset>

      <fieldset>
        <legend className={sectionTitle}>Quiet hours</legend>
        <p className="mt-1 text-ink-muted">
          No reminders or cheer-ups arrive between these times. They follow your timezone ({timezone.replaceAll("_", " ")}).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-label text-ink">
            From
            <input
              type="time"
              name="quiet_start"
              defaultValue={quietStart}
              required
              className="min-h-12 rounded-sm border border-line bg-surface-raised px-4 text-body text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-label text-ink">
            Until
            <input
              type="time"
              name="quiet_end"
              defaultValue={quietEnd}
              required
              className="min-h-12 rounded-sm border border-line bg-surface-raised px-4 text-body text-ink"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={sectionTitle}>New wins start as</legend>
        <p className="mt-1 text-ink-muted">The composer also remembers whichever you picked last time.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className={optionCard}>
            <input
              type="radio"
              name="default_visibility"
              value="public"
              defaultChecked={defaultVisibility === "public"}
              className="sr-only"
            />
            <span className="text-label text-ink">Public</span>
            <span className="text-caption text-ink-muted">Shared in the feed</span>
          </label>
          <label className={optionCard}>
            <input
              type="radio"
              name="default_visibility"
              value="private"
              defaultChecked={defaultVisibility === "private"}
              className="sr-only"
            />
            <span className="text-label text-ink">Just me</span>
            <span className="text-caption text-ink-muted">Only in your jar</span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`text-label ${state.status === "error" ? "text-danger" : "text-sage-ink"}`}
          >
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card transition-shadow duration-200 hover:shadow-lift disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
