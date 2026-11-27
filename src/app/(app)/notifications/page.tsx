import type { Metadata } from "next";
import { Suspense } from "react";
import { MarkNoteSeen } from "@/components/notifications/mark-note-seen";
import { SparkleIcon } from "@/components/ui/icons";
import { requireOnboardedProfile } from "@/lib/auth";
import { noteForDate } from "@/lib/daily-notes";
import { formatDayHeading, localToday } from "@/lib/dates";
import { getLitDates } from "@/lib/home/queries";
import { computeStreak } from "@/lib/streak";
import { countMyWins } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-0.5">
        <h1 className="font-serif text-[28px] leading-[34px] font-semibold md:text-[36px] md:leading-[42px]">Notifications</h1>
        <p className="text-label font-normal text-ink-muted">One gentle note a day, just for you.</p>
      </header>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-[28px] bg-dusk/80" />}>
        <TodaysNote />
      </Suspense>
    </div>
  );
}

function personalLine(current: number, todayLit: boolean, totalLights: number): string {
  if (todayLit) return `Today is lit, and your glow streak is at ${current} ${current === 1 ? "day" : "days"}.`;
  if (current > 0) return `Your glow streak is at ${current} ${current === 1 ? "day" : "days"}. One light today keeps it glowing.`;
  if (totalLights > 0) return `Your jar holds ${totalLights} ${totalLights === 1 ? "light" : "lights"}. One more today starts it glowing again.`;
  return "Your jar is ready for its first light.";
}

async function TodaysNote() {
  const profile = await requireOnboardedProfile();
  // The note follows the person's own day, so it changes at their midnight.
  const today = localToday(profile.timezone);
  const [litDates, totalLights] = await Promise.all([getLitDates(today), countMyWins(profile.user_id)]);
  const streak = computeStreak(litDates, today);
  const note = noteForDate(today);

  return (
    <>
      <article
        aria-labelledby="glow-note-heading"
        className="flex flex-col gap-4 rounded-[28px] bg-[#34406B] p-6 text-[#FBF7F0] shadow-lift md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="glow-note-heading"
            className="flex items-center gap-2 text-caption font-semibold tracking-[0.08em] text-[#F7D48C] uppercase"
          >
            <SparkleIcon className="size-4" />
            Today&apos;s glow note
          </h2>
          <p className="text-caption font-normal text-[#C9CDE3]">{formatDayHeading(today)}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-caption font-semibold text-[#C9CDE3]">Did you know?</p>
          <p className="font-serif text-[20px] leading-[29px] md:text-[22px] md:leading-[31px]">{note.fact}</p>
        </div>

        <p className="border-t border-white/12 pt-4 text-body">{note.cheer}</p>

        <p className="self-start rounded-pill bg-[#A9C9B2]/18 px-4 py-2 text-label text-[#DDEEDF]">
          {personalLine(streak.current, streak.todayLit, totalLights)}
        </p>
      </article>

      <p className="text-label font-normal text-ink-muted">A new note arrives tomorrow.</p>
      <MarkNoteSeen today={today} />
    </>
  );
}
