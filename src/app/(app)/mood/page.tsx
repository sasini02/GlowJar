import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MoodCheckIn } from "@/components/mood/mood-check-in";
import { HardDayCard, MonthAtAGlance, WhatShapesYourMood, WinsAndMoodCard } from "@/components/mood/mood-insights";
import { MoodMonthGrid, MoodScaleLegend } from "@/components/mood/mood-month-grid";
import { MoodWeek, MoodYear } from "@/components/mood/mood-periods";
import { TonightCard } from "@/components/mood/tonight-card";
import { requireOnboardedProfile } from "@/lib/auth";
import { formatLongDate, formatMonth, localToday, startOfMonth, startOfWeek, weekDates } from "@/lib/dates";
import { getLitDates } from "@/lib/home/queries";
import { hadHeavyStretch } from "@/lib/mood";
import { getMoods, getRecentMoods } from "@/lib/moods/queries";
import { localHour, timeOfDay } from "@/lib/time";
import { countMyWins } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "Mood board" };

type View = "week" | "month" | "year";

const VIEWS: { value: View; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function MoodBoardPage({ searchParams }: PageProps<"/mood">) {
  return (
    <Suspense fallback={<MoodSkeleton />}>
      <MoodBoard searchParams={searchParams} />
    </Suspense>
  );
}

async function MoodBoard({ searchParams }: Pick<PageProps<"/mood">, "searchParams">) {
  const profile = await requireOnboardedProfile();
  const { view: viewParam } = await searchParams;
  const view: View = viewParam === "week" || viewParam === "year" ? viewParam : "month";

  const today = localToday(profile.timezone);
  const moment = timeOfDay(localHour(profile.timezone));
  const monthStart = startOfMonth(today);
  const weekStart = startOfWeek(today);
  // Insights always cover this month, so fetch at least that much whichever view is open.
  const from = view === "year" ? `${today.slice(0, 4)}-01-01` : view === "week" && weekStart < monthStart ? weekStart : monthStart;

  const [entries, litDates, recent, totalLights] = await Promise.all([
    getMoods(profile.user_id, from, today),
    getLitDates(today),
    getRecentMoods(profile.user_id, 3),
    countMyWins(profile.user_id),
  ]);
  const monthEntries = entries.filter((entry) => entry.date >= monthStart);
  const todayMood = entries.find((entry) => entry.date === today) ?? null;

  const heading =
    view === "year" ? today.slice(0, 4) : view === "week" ? `Week of ${formatLongDate(weekStart)}` : formatMonth(today, { withYear: true });

  const gridHeading = view === "week" ? "This week" : view === "year" ? "This year" : `Your ${formatMonth(today)}`;

  return (
    <div className="flex max-w-[1160px] flex-col gap-[22px] md:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3 md:gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-label text-ink-muted">{heading}</p>
          <h1 className="font-serif text-[28px] leading-[34px] font-semibold md:text-[36px] md:leading-[42px]">Mood board</h1>
        </div>
        <nav aria-label="Mood board range">
          <ul className="flex rounded-pill bg-[#F1EADF] p-1">
            {VIEWS.map(({ value, label }) => (
              <li key={value} className={value === "year" ? "hidden md:block" : ""}>
                <Link
                  href={value === "month" ? "/mood" : `/mood?view=${value}`}
                  aria-current={view === value ? "page" : undefined}
                  className="-my-1 block rounded-pill py-1"
                >
                  <span
                    className={`inline-flex h-9 items-center rounded-pill px-3.5 text-[13px] md:h-[38px] md:px-4 md:text-label ${
                      view === value ? "bg-surface-raised font-bold text-ink shadow-[0_1px_3px_rgba(42,45,58,0.12)]" : "font-semibold text-[#4F5363]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="md:hidden">
        <TonightCard mood={todayMood} moment={moment} />
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <section
          aria-label="Check in"
          className="hidden min-w-0 flex-[2_1_340px] rounded-[28px] bg-surface-raised p-7 shadow-card md:block"
        >
          <MoodCheckIn variant="panel" initialLevel={todayMood?.level ?? 3} initialTags={todayMood?.tags ?? []} moment={moment} />
        </section>

        <section
          aria-labelledby="mood-grid-heading"
          className="flex min-w-0 flex-[3_1_520px] flex-col gap-3.5 rounded-[24px] bg-surface-raised p-4 shadow-card md:gap-[18px] md:rounded-[28px] md:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="mood-grid-heading" className="sr-only font-serif text-[22px] leading-7 font-semibold md:not-sr-only">
              {gridHeading}
            </h2>
            {view !== "year" && (
              <div className="hidden md:block">
                <MoodScaleLegend />
              </div>
            )}
          </div>
          {view === "week" && <MoodWeek dates={weekDates(today)} today={today} entries={entries} />}
          {view === "month" && <MoodMonthGrid month={today} today={today} entries={monthEntries} />}
          {view === "year" && <MoodYear today={today} entries={entries} />}
          {view !== "year" && (
            <div className="md:hidden">
              <MoodScaleLegend />
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-stretch gap-[22px] md:gap-5">
        <div className="min-w-0 flex-[1_1_300px]">
          <MonthAtAGlance entries={monthEntries} />
        </div>
        <div className="min-w-0 flex-[1_1_300px]">
          <WinsAndMoodCard entries={monthEntries} litDates={litDates} />
        </div>
        <div className="min-w-0 flex-[1_1_300px]">
          <WhatShapesYourMood entries={monthEntries} />
        </div>
      </div>

      {hadHeavyStretch(recent) && <HardDayCard lights={totalLights} />}
    </div>
  );
}

function MoodSkeleton() {
  return (
    <div className="flex max-w-[1160px] flex-col gap-6" aria-busy="true" aria-label="Loading your mood board">
      <div className="h-20 w-72 max-w-full animate-pulse rounded-md bg-surface-raised" />
      <div className="h-96 animate-pulse rounded-[28px] bg-surface-raised" />
    </div>
  );
}
