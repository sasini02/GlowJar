import Link from "next/link";
import { moodStyle, type MoodEntry } from "@/lib/mood";
import type { TimeOfDay } from "@/lib/time";
import { MoodOrb } from "./mood-orb";

const MOMENT_LABEL: Record<TimeOfDay, string> = { morning: "This morning", today: "Today", tonight: "Tonight" };

/** Today's check-in at the top of the mood board on phones, with a way to change it. */
export function TonightCard({ mood, moment }: { mood: MoodEntry | null; moment: TimeOfDay }) {
  return (
    <section aria-label={MOMENT_LABEL[moment]} className="flex items-center gap-3.5 rounded-[24px] bg-surface-raised p-4 shadow-card">
      <MoodOrb level={mood?.level ?? 3} size={56} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-caption font-semibold text-ink-muted">{MOMENT_LABEL[moment]}</p>
        {mood ? (
          <>
            <p className="font-serif text-[20px] leading-[26px] font-semibold">{moodStyle(mood.level).label}</p>
            {mood.tags.length > 0 && <p className="truncate text-caption font-normal text-ink-muted">{mood.tags.join(" · ")}</p>}
          </>
        ) : (
          <p className="font-serif text-[20px] leading-[26px] font-semibold">Not checked in yet</p>
        )}
      </div>
      <Link href="/mood/check-in?from=/mood" className="-my-0.5 shrink-0 rounded-pill py-0.5">
        <span
          className={`inline-flex h-10 items-center rounded-pill px-3.5 text-[13px] font-semibold ${
            mood ? "border border-line text-ink" : "bg-[#F2B544] text-[#2A2D3A]"
          }`}
        >
          {mood ? "Update" : "Check in"}
        </span>
      </Link>
    </section>
  );
}
