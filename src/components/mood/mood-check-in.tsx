"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { showToast } from "@/components/ui/toaster";
import { saveMood } from "@/lib/actions/mood";
import { moodStyle, type MoodLevel, type MoodTag } from "@/lib/mood";
import { timeOfDayPhrase, type TimeOfDay } from "@/lib/time";
import { MoodOrb } from "./mood-orb";
import { MoodSlider } from "./mood-slider";
import { MoodTagChips } from "./mood-tag-chips";

type MoodCheckInProps = {
  initialLevel: MoodLevel;
  initialTags: MoodTag[];
  moment: TimeOfDay;
  /**
   * "sheet" is the check-in screen: full screen on phones, closing back to `returnTo`.
   * "panel" sits on the mood board on wider screens and stays put after saving.
   */
  variant: "sheet" | "panel";
  returnTo?: string;
};

const SAVED_MESSAGE = "Saved. Only you can see this.";

export function MoodCheckIn({ initialLevel, initialTags, moment, variant, returnTo = "/mood" }: MoodCheckInProps) {
  const ids = useId();
  const router = useRouter();
  const [level, setLevel] = useState(initialLevel);
  const [tags, setTags] = useState(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();
  const sheet = variant === "sheet";
  const when = timeOfDayPhrase(moment);

  function toggleTag(tag: MoodTag) {
    setTags((current) => (current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveMood(level, tags);
      if (result.error) {
        setError(result.error);
        return;
      }
      showToast({ message: SAVED_MESSAGE });
      if (sheet) router.replace(returnTo);
      else router.refresh();
    });
  }

  const saveButton = (
    <button
      type="button"
      onClick={save}
      disabled={saving}
      className={`w-full rounded-md bg-[#F2B544] text-body font-bold text-[#2A2D3A] disabled:opacity-60 ${sheet ? "h-[54px]" : "h-13"}`}
    >
      {saving ? "Saving…" : "Save my mood"}
    </button>
  );

  if (!sheet) {
    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-caption font-semibold tracking-[0.08em] text-ink-muted uppercase">
            {moment === "tonight" ? "Tonight's" : moment === "morning" ? "This morning's" : "Today's"} check-in
          </p>
          <h2 className="font-serif text-[26px] leading-8 font-semibold">How are you feeling?</h2>
        </div>
        <div className="flex h-[200px] items-center justify-center">
          <MoodOrb level={level} size={148} glow />
        </div>
        <p aria-live="polite" className="text-center font-serif text-[26px] leading-8 font-normal">
          {moodStyle(level).label}
        </p>
        <MoodSlider value={level} onChange={setLevel} />
        <p id={`${ids}-tags`} className="sr-only">
          What&apos;s shaping it? (Optional)
        </p>
        <MoodTagChips selected={tags} onToggle={toggleTag} labelledBy={`${ids}-tags`} size="small" centered />
        {error && (
          <p role="alert" className="text-label text-danger">
            {error}
          </p>
        )}
        <div className="mt-auto">{saveButton}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-[calc(28px+env(safe-area-inset-bottom))] md:p-0">
      <div className="flex justify-end">
        <Link
          href={returnTo}
          aria-label="Close"
          className="inline-flex size-11 items-center justify-center rounded-pill bg-surface-raised text-ink shadow-card"
        >
          <ChevronDown className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-caption font-semibold tracking-[0.08em] text-ink-muted uppercase">Mood check-in</p>
        <h1 className="font-serif text-[30px] leading-9 font-semibold">How are you feeling {when}?</h1>
      </div>

      <div className="flex h-[230px] items-center justify-center">
        <MoodOrb level={level} size={172} glow />
      </div>

      <p aria-live="polite" className="text-center font-serif text-[28px] leading-[34px] font-normal">
        {moodStyle(level).label}
      </p>

      <div className="mt-5">
        <MoodSlider value={level} onChange={setLevel} ticks />
      </div>

      <div className="mt-[22px] flex flex-col gap-2.5">
        <p id={`${ids}-tags`} className="text-label font-semibold">
          What&apos;s shaping it? <span className="font-normal text-ink-muted">Optional</span>
        </p>
        <MoodTagChips selected={tags} onToggle={toggleTag} labelledBy={`${ids}-tags`} />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-label text-danger">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 mt-auto bg-surface pt-6 md:static md:bg-transparent">{saveButton}</div>
    </div>
  );
}
