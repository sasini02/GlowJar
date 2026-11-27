import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { CheerList } from "@/components/home/cheer-list";
import { InlineComposer } from "@/components/home/inline-composer";
import { NextMilestone } from "@/components/home/next-milestone";
import { HomeOnThisDay } from "@/components/home/on-this-day";
import { StatTiles } from "@/components/home/stat-tiles";
import { TopCategory } from "@/components/home/top-category";
import { MoodQuickPick } from "@/components/mood/mood-quick-pick";
import { MilestoneSheet } from "@/components/streak/milestone-sheet";
import { MonthDots } from "@/components/streak/month-dots";
import { StreakHero } from "@/components/streak/streak-hero";
import { requireOnboardedProfile } from "@/lib/auth";
import { dayOfMonth, formatDayHeading, formatMonth, localToday } from "@/lib/dates";
import { getLitDates, getMonthCategories, syncStreakRecords } from "@/lib/home/queries";
import { getOnThisDay } from "@/lib/jar/queries";
import { isJarStyle } from "@/lib/milestones";
import { getMoods } from "@/lib/moods/queries";
import { computeStreak } from "@/lib/streak";
import { greetingFor, localHour, timeOfDay } from "@/lib/time";
import { countMyWins, getWinsToCheer } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const profile = await requireOnboardedProfile();
  const today = localToday(profile.timezone);
  const hour = localHour(profile.timezone);

  const [litDates, monthCategories, totalLights, todayMoods, onThisDay, toCheer] = await Promise.all([
    getLitDates(today),
    getMonthCategories(profile.user_id, today),
    countMyWins(profile.user_id),
    getMoods(profile.user_id, today, today),
    getOnThisDay(),
    getWinsToCheer(profile.user_id, 3),
  ]);

  const streak = computeStreak(litDates, today);
  const milestoneToCelebrate = await syncStreakRecords({
    userId: profile.user_id,
    bestStreak: profile.best_streak,
    current: streak.current,
    today,
  });
  const bestStreak = Math.max(profile.best_streak, streak.current);
  const jarStyle = isJarStyle(profile.jar_style) ? profile.jar_style : "classic";
  const defaultPublic = profile.default_visibility === "public";

  const monthName = formatMonth(today);

  return (
    <div className="flex max-w-[1160px] flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-label text-ink-muted">{formatDayHeading(today)}</p>
          <h1 className="truncate font-serif text-[26px] leading-8 font-semibold md:text-[36px] md:leading-[42px]">
            {greetingFor(hour)}, {profile.username}
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-2.5">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-raised text-ink"
          >
            <Bell className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <Link
            href="/settings"
            aria-label="Your profile and settings"
            className="inline-flex size-11 items-center justify-center rounded-pill bg-card-lilac font-serif text-[18px] font-semibold text-ink"
          >
            {profile.username.charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-stretch gap-5">
        <div className="min-w-0 flex-[3_1_520px]">
          <StreakHero
            current={streak.current}
            restLeftThisWeek={streak.restLeftThisWeek}
            todayLit={streak.todayLit}
            week={streak.week}
            today={today}
            totalLights={totalLights}
            jarStyle={jarStyle}
            username={profile.username}
            defaultPublic={defaultPublic}
          />
        </div>
        <div className="hidden min-w-0 flex-[2_1_340px] md:block">
          <InlineComposer defaultPublic={defaultPublic} promptSeed={dayOfMonth(today)} />
        </div>
      </div>

      <MoodQuickPick initialLevel={todayMoods[0]?.level ?? null} moment={timeOfDay(hour)} />

      <StatTiles
        monthWins={monthCategories.total}
        monthShort={monthName.slice(0, 3)}
        monthLong={monthName}
        totalLights={totalLights}
        bestStreak={bestStreak}
        current={streak.current}
      />

      <div className="md:hidden">
        <NextMilestone current={streak.current} />
      </div>

      <div className="flex flex-wrap items-start gap-6 md:gap-5">
        <div className="min-w-0 flex-[3_1_480px]">
          <MonthDots month={streak.month} today={today} monthName={monthName} />
        </div>
        <div className="min-w-0 flex-[2_1_320px]">
          <TopCategory categories={monthCategories} />
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-6 md:gap-5">
        {onThisDay && (
          <div className="min-w-0 flex-[1_1_320px]">
            <HomeOnThisDay win={onThisDay} />
          </div>
        )}
        <div className="min-w-0 flex-[2_1_520px]">
          <CheerList wins={toCheer} now={currentTime()} />
        </div>
      </div>

      {milestoneToCelebrate && <MilestoneSheet days={milestoneToCelebrate} />}
    </div>
  );
}

/** The request time, for "2h ago" labels. Home is rendered per request, never cached. */
function currentTime() {
  return Date.now();
}

function HomeSkeleton() {
  return (
    <div className="flex max-w-[1160px] flex-col gap-6" aria-busy="true" aria-label="Loading your home">
      <div className="h-14 w-72 max-w-full animate-pulse rounded-md bg-surface-raised" />
      <div className="grid gap-6 min-[900px]:grid-cols-[3fr_2fr]">
        <div className="h-80 animate-pulse rounded-[28px] bg-dusk/80" />
        <div className="hidden h-80 animate-pulse rounded-[28px] bg-surface-raised md:block" />
      </div>
      <div className="h-32 animate-pulse rounded-[24px] bg-surface-raised" />
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-28 animate-pulse rounded-[24px] bg-surface-raised" />
        ))}
      </div>
    </div>
  );
}
