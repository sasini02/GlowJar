"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { Globe, Lock } from "lucide-react";
import { createWin, updateWin, type WinFormState } from "@/lib/actions/wins";
import { CATEGORIES, CATEGORY_ORDER, type WinCategory } from "@/lib/categories";
import { EMOJI_CHOICES, WIN_IDEAS } from "@/lib/wins/ideas";
import { charCount, MAX_WIN_LENGTH } from "@/lib/wins/validation";
import { suggestsStruggle } from "../../../supabase/functions/_shared/moderation";

export type ComposerValues = {
  text: string;
  emoji: string | null;
  category: WinCategory;
  isPublic: boolean;
};

type WinComposerProps = {
  username: string;
  initial: ComposerValues;
  /** Present when editing an existing win. */
  winId?: string;
  returnTo?: string;
  showIdeas?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
};

const initialState: WinFormState = { error: null };

export function WinComposer({
  username,
  initial,
  winId,
  returnTo,
  showIdeas = !winId,
  autoFocus = false,
  onCancel,
}: WinComposerProps) {
  const [state, formAction, saving] = useActionState(winId ? updateWin : createWin, initialState);
  const [text, setText] = useState(initial.text);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [category, setCategory] = useState(initial.category);
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const ids = useId();

  const length = charCount(text);
  const remaining = MAX_WIN_LENGTH - length;
  const canSubmit = text.trim().length > 0 && remaining >= 0 && !saving;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {winId && <input type="hidden" name="id" value={winId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <input type="hidden" name="emoji" value={emoji ?? ""} />

      <div
        className={`rounded-lg p-7 shadow-card transition-colors duration-300 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring ${CATEGORIES[category].tint}`}
      >
        {emoji && <p className="mb-3 text-win-emoji">{emoji}</p>}
        <label htmlFor={`${ids}-text`} className="sr-only">
          Your win
        </label>
        <textarea
          id={`${ids}-text`}
          name="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          autoFocus={autoFocus}
          placeholder="What went right today, however small?"
          aria-describedby={`${ids}-count`}
          className="block w-full resize-none bg-transparent font-serif text-win-text text-ink placeholder:text-ink-muted focus-visible:outline-none"
        />
        <p
          id={`${ids}-count`}
          aria-live="polite"
          className={`mt-2 text-right text-caption ${remaining < 0 ? "text-danger" : "text-ink-muted"}`}
        >
          {remaining < 0 ? `${-remaining} over the limit` : `${remaining} left`}
        </p>
      </div>

      {/* Never blocks writing: just a quiet offer of support. */}
      {suggestsStruggle(text) && (
        <p role="status" className="rounded-md bg-dusk px-4 py-3 text-label text-on-dusk">
          It sounds like things are really hard right now. You don&apos;t have to carry this alone.{" "}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-4"
          >
            Find support near you
          </a>
        </p>
      )}

      {showIdeas && (
        <div>
          <p className="text-label text-ink-muted">Not sure what counts? Try one:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WIN_IDEAS.map((idea) => (
              <button
                key={idea.text}
                type="button"
                onClick={() => {
                  setText(idea.text);
                  setCategory(idea.category);
                }}
                className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface-raised px-4 text-label text-ink transition-colors duration-200 hover:bg-surface"
              >
                {idea.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <fieldset>
        <legend className="text-label text-ink">Add an emoji (optional)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={emoji === choice}
              onClick={() => setEmoji(emoji === choice ? null : choice)}
              className={`inline-flex size-11 items-center justify-center rounded-pill text-body transition-colors duration-200 ${
                emoji === choice ? "bg-glow-soft ring-2 ring-dusk" : "bg-surface-raised hover:bg-surface"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label text-ink">Category</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((value) => (
            <label
              key={value}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-4 text-label text-ink transition-colors duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring ${
                category === value ? `border-dusk ${CATEGORIES[value].tint}` : "border-line bg-surface-raised"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={value}
                checked={category === value}
                onChange={() => setCategory(value)}
                className="sr-only"
              />
              <span aria-hidden="true" className={`size-3 rounded-pill ${CATEGORIES[value].tint} ring-1 ring-line`} />
              {CATEGORIES[value].label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-label text-ink">Who can see it?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <VisibilityOption
            name="visibility"
            value="public"
            checked={isPublic}
            onSelect={() => setIsPublic(true)}
            icon={<Globe className="size-4" strokeWidth={1.75} aria-hidden="true" />}
            title="Public"
            description={`Shared in the feed as ${username}. Your email is never shown.`}
          />
          <VisibilityOption
            name="visibility"
            value="private"
            checked={!isPublic}
            onSelect={() => setIsPublic(false)}
            icon={<Lock className="size-4" strokeWidth={1.75} aria-hidden="true" />}
            title="Just me"
            description="Only you can see it, in your jar."
          />
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-label text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-6 text-label text-ink"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-ink shadow-card transition-shadow duration-200 hover:shadow-lift disabled:opacity-60 disabled:shadow-none"
        >
          {saving ? "Saving…" : winId ? "Save changes" : "Add to my jar"}
        </button>
      </div>
    </form>
  );
}

type VisibilityOptionProps = {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  description: string;
};

function VisibilityOption({ name, value, checked, onSelect, icon, title, description }: VisibilityOptionProps) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-1 rounded-md border p-4 transition-colors duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring ${
        checked ? "border-dusk bg-surface-raised" : "border-line"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span className="inline-flex items-center gap-2 text-label text-ink">
        {icon}
        {title}
      </span>
      <span className="text-caption text-ink-muted">{description}</span>
    </label>
  );
}
