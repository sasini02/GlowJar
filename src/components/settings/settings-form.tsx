"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsState } from "@/lib/actions/profile";
import { NUDGE_OPTIONS } from "@/lib/nudge";
import type { Enums } from "@/lib/supabase/database.types";

const initialState: SettingsState = { status: "idle", message: null };

type SettingsFormProps = {
  nudgeTime: Enums<"nudge_time">;
  glowReminders: boolean;
  quietStart: string;
  quietEnd: string;
  defaultVisibility: Enums<"visibility">;
  timezone: string;
};

const sectionTitle = "font-serif text-[17px] leading-6 font-semibold";
const sectionHint = "mt-0.5 text-label font-normal text-ink-muted";
const optionCard =
  "flex min-h-14 cursor-pointer flex-col justify-center rounded-md border border-line bg-surface px-4 py-3 transition-colors duration-200 has-checked:border-dusk has-checked:bg-card-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring";

/** Reminders, quiet hours and the default for new wins, saved together from the button at the end. */
export function SettingsForm({ nudgeTime, glowReminders, quietStart, quietEnd, defaultVisibility, timezone }: SettingsFormProps) {
  const [state, formAction, saving] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-serif text-[20px] leading-[26px] font-semibold">Reminders and new wins</h2>
        <p className="text-label font-normal text-ink-muted">Change these, then save them together below.</p>
      </div>

      <fieldset>
        <legend className={sectionTitle}>Daily nudge</legend>
        <p className={sectionHint}>
          One gentle reminder, only on days you haven&apos;t added a win yet, and never at night.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
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
        <p className={sectionHint}>
          No reminders or cheer-ups arrive between these times. They follow your timezone ({timezone.replaceAll("_", " ")}).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-label text-ink">
            From
            <input
              type="time"
              name="quiet_start"
              defaultValue={quietStart}
              required
              className="h-12 rounded-md border border-line bg-surface px-4 text-body text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-label text-ink">
            Until
            <input
              type="time"
              name="quiet_end"
              defaultValue={quietEnd}
              required
              className="h-12 rounded-md border border-line bg-surface px-4 text-body text-ink"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={sectionTitle}>New wins start as</legend>
        <p className={sectionHint}>The composer also remembers whichever you picked last time.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
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

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
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
          className="inline-flex h-12 items-center justify-center rounded-md bg-[#F2B544] px-6 text-label font-semibold text-[#2A2D3A] disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
