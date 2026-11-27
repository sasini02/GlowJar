"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { SparkleIcon } from "@/components/ui/icons";
import { createWin, type WinFormState } from "@/lib/actions/wins";
import { guessCategory } from "@/lib/categories";
import { queueWin } from "@/lib/offline/queue";
import { charCount, MAX_WIN_LENGTH } from "@/lib/wins/validation";
import { suggestsStruggle } from "../../../supabase/functions/_shared/moderation";

// Gentle nudges for the prompt chip. Each tap shows the next one.
const PROMPTS = [
  "Replied to a hard message?",
  "Drank a glass of water?",
  "Stepped outside for a bit?",
  "Finished one small task?",
  "Messaged a friend first?",
  "Let a worry pass?",
  "Rested without guilt?",
];

type InlineComposerProps = {
  defaultPublic: boolean;
  /** Picks which prompt the chip starts on, so it changes from day to day. */
  promptSeed: number;
};

const initialState: WinFormState = { error: null };

/** The "Light up today" composer beside the streak on wider screens. Saving keeps you on Home. */
export function InlineComposer({ defaultPublic, promptSeed }: InlineComposerProps) {
  const ids = useId();
  const [text, setText] = useState("");
  const [isPublic, setIsPublic] = useState(defaultPublic);
  const [promptIndex, setPromptIndex] = useState(promptSeed % PROMPTS.length);
  const [note, setNote] = useState<"saved" | "queued" | null>(null);
  const [state, formAction, saving] = useActionState(async (previous: WinFormState, formData: FormData) => {
    const result = await createWin(previous, formData);
    if (result.savedAt) {
      setText("");
      setNote("saved");
    }
    return result;
  }, initialState);

  const message = state.error
    ? { text: state.error, tone: "text-danger" }
    : note === "saved"
      ? { text: "That counts. One more light in your jar.", tone: "text-sage-ink" }
      : note === "queued"
        ? { text: "You're offline, so it's saved on this device for now.", tone: "font-normal text-ink-muted" }
        : null;
  const length = charCount(text);

  // Offline, the win waits on the device; OfflineQueueSync saves it once the connection is back.
  async function queueIfOffline(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;
    event.preventDefault();
    try {
      await queueWin({ text: text.trim(), emoji: null, category: guessCategory(text), isPublic });
      setText("");
      setNote("queued");
    } catch {
      setNote(null);
    }
  }

  return (
    <section
      aria-labelledby={`${ids}-heading`}
      className="flex h-full flex-col gap-3.5 rounded-[28px] bg-surface-raised p-6 shadow-card"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id={`${ids}-heading`} className="font-serif text-[22px] leading-7 font-semibold">
          Light up today
        </h2>
        <p className="text-label font-normal text-ink-muted">One small win is enough.</p>
      </div>

      <button
        type="button"
        aria-label={`Writing idea: ${PROMPTS[promptIndex]} Show another idea`}
        onClick={() => setPromptIndex((index) => (index + 1) % PROMPTS.length)}
        className="inline-flex h-9 items-center gap-1.5 self-start rounded-pill border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink"
      >
        <RefreshCw className="size-3.5 text-glow-ink" strokeWidth={2} aria-hidden="true" />
        {PROMPTS[promptIndex]}
      </button>

      <form action={formAction} onSubmit={queueIfOffline} className="flex flex-1 flex-col gap-3.5">
        <input type="hidden" name="stay" value="1" />
        <input type="hidden" name="emoji" value="" />
        <input type="hidden" name="visibility" value={isPublic ? "public" : "private"} />
        {/* This composer doesn't ask for a category; it's read from the words and can be changed later in My jar. */}
        <input type="hidden" name="category" value={guessCategory(text)} />

        <label htmlFor={`${ids}-text`} className="text-[13px] font-semibold text-ink-muted-tint">
          Your win
        </label>
        <textarea
          id={`${ids}-text`}
          name="text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setNote(null);
          }}
          rows={4}
          placeholder="Today I…"
          aria-describedby={`${ids}-count`}
          className="min-h-[110px] flex-1 resize-none rounded-md border border-line bg-surface p-3.5 font-serif text-[18px] leading-[26px] text-ink placeholder:text-ink-muted"
        />

        {suggestsStruggle(text) && (
          <p role="status" className="rounded-md bg-dusk px-4 py-3 text-label text-on-dusk">
            It sounds like things are really hard right now. You don&apos;t have to carry this alone.{" "}
            <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
              Find support near you
            </a>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div role="group" aria-label="Who can see this" className="flex gap-1.5">
            <VisibilityPill active={isPublic} onSelect={() => setIsPublic(true)} label="Public" />
            <VisibilityPill active={!isPublic} onSelect={() => setIsPublic(false)} label="Private" />
          </div>
          <span id={`${ids}-count`} className={`text-caption font-normal ${length > MAX_WIN_LENGTH ? "text-danger" : "text-ink-muted"}`}>
            {length} / {MAX_WIN_LENGTH}
          </span>
        </div>

        {message && (
          <p aria-hidden="true" className={`text-label ${message.tone}`}>
            {message.text}
          </p>
        )}
        {/* Always present, so screen readers hear the message when it appears. */}
        <p aria-live="polite" className="sr-only">
          {message?.text}
        </p>

        <button
          type="submit"
          // Always drawn solid, as in the design; an empty or too-long win gets the server's message instead.
          disabled={saving}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-[#F2B544] text-body font-bold text-[#2A2D3A] disabled:opacity-80"
        >
          <SparkleIcon className="size-[18px]" />
          {saving ? "Saving…" : "Add to my jar"}
        </button>
      </form>
    </section>
  );
}

/** A 36px pill, as drawn in the design, inside a 44px tap area. */
function VisibilityPill({ active, onSelect, label }: { active: boolean; onSelect: () => void; label: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onSelect} className="-my-1 rounded-pill py-1">
      <span
        className={`inline-flex h-9 items-center rounded-pill px-3 text-[13px] font-semibold transition-colors duration-200 ${
          active ? "bg-ink text-surface" : "border border-line bg-surface-raised text-ink"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
