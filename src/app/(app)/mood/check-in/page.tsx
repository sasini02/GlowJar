import type { Metadata } from "next";
import { Suspense } from "react";
import { MoodCheckIn } from "@/components/mood/mood-check-in";
import { requireOnboardedProfile } from "@/lib/auth";
import { localToday } from "@/lib/dates";
import { getMoods } from "@/lib/moods/queries";
import { localHour, timeOfDay } from "@/lib/time";

export const metadata: Metadata = { title: "Mood check-in" };

// Only screens that link here; anything else in ?from= is ignored so it can't send people off-site.
const RETURN_PATHS = ["/home", "/mood"];

export default function CheckInPage({ searchParams }: PageProps<"/mood/check-in">) {
  return (
    // A full-screen sheet over the tab bar on phones; an ordinary page on wider screens.
    <div className="fixed inset-0 z-40 overflow-y-auto bg-surface md:static md:z-auto md:mx-auto md:max-w-xl md:overflow-visible md:rounded-[28px] md:bg-surface-raised md:p-8 md:shadow-card">
      <Suspense fallback={<div className="m-5 h-[80dvh] animate-pulse rounded-[28px] bg-surface-raised md:m-0" />}>
        <CheckIn searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CheckIn({ searchParams }: Pick<PageProps<"/mood/check-in">, "searchParams">) {
  const profile = await requireOnboardedProfile();
  const { from } = await searchParams;
  const returnTo = typeof from === "string" && RETURN_PATHS.includes(from) ? from : "/mood";
  const today = localToday(profile.timezone);
  const [mood] = await getMoods(profile.user_id, today, today);

  return (
    <MoodCheckIn
      variant="sheet"
      initialLevel={mood?.level ?? 3}
      initialTags={mood?.tags ?? []}
      moment={timeOfDay(localHour(profile.timezone))}
      returnTo={returnTo}
    />
  );
}
