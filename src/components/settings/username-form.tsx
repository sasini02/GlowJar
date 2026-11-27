"use client";

import { useActionState, useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { suggestUsername, updateUsername, type UsernameState } from "@/lib/actions/profile";

const initialState: UsernameState = { status: "idle", message: null };

/** The public name, with Shuffle and its own Save right beside it. */
export function UsernameForm({ username: initialUsername }: { username: string }) {
  const [saved, setSaved] = useState(initialUsername);
  const [username, setUsername] = useState(initialUsername);
  const [shuffling, startShuffle] = useTransition();
  const [state, formAction, saving] = useActionState(async (previous: UsernameState, formData: FormData) => {
    const result = await updateUsername(previous, formData);
    if (result.username) {
      setSaved(result.username);
      setUsername(result.username);
    }
    return result;
  }, initialState);

  const changed = username.replace(/\s+/g, " ").trim() !== saved;

  function shuffle() {
    startShuffle(async () => {
      const suggestion = await suggestUsername();
      if (suggestion) setUsername(suggestion);
    });
  }

  const message = changed
    ? { text: "Not saved yet. Press Save to keep this name.", tone: "text-ink-muted" }
    : state.message
      ? { text: state.message, tone: state.status === "error" ? "text-danger" : "text-sage-ink" }
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <label htmlFor="settings-username" className="font-serif text-[20px] leading-[26px] font-semibold">
          Your name
        </label>
        <p className="text-label font-normal text-ink-muted">The only thing anyone else ever sees.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          id="settings-username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          minLength={3}
          maxLength={32}
          autoComplete="off"
          aria-describedby="settings-username-status"
          className="h-12 min-w-0 flex-[1_1_200px] rounded-md border border-line bg-surface px-4 text-body text-ink"
        />
        <button
          type="button"
          onClick={shuffle}
          disabled={shuffling}
          className="inline-flex h-12 items-center gap-2 rounded-md border border-line bg-surface-raised px-4 text-label text-ink transition-colors duration-200 hover:bg-surface disabled:opacity-70"
        >
          <Shuffle className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Shuffle
        </button>
        <button
          type="submit"
          disabled={!changed || saving}
          className="inline-flex h-12 items-center justify-center rounded-md bg-[#F2B544] px-6 text-label font-semibold text-[#2A2D3A] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <p id="settings-username-status" aria-live="polite" className={`min-h-5 text-label font-normal ${message?.tone ?? ""}`}>
        {message?.text}
      </p>
    </form>
  );
}
