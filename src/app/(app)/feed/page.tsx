import type { Metadata } from "next";
import { Fragment, Suspense } from "react";
import { JarMark } from "@/components/brand/jar-mark";
import { CategoryFilters } from "@/components/feed/category-filters";
import { JarCard } from "@/components/feed/jar-card";
import { QuickAdd } from "@/components/feed/quick-add";
import { WinCard } from "@/components/wins/win-card";
import { requireOnboardedProfile } from "@/lib/auth";
import { CATEGORIES, CATEGORY_ORDER, type WinCategory } from "@/lib/categories";
import { greetingFor, localHour } from "@/lib/time";
import { countWinsThisMonth, getFeedWins } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "Feed" };

// The "Your jar" card slots in after this many wins so it's seen without leading the feed.
const JAR_CARD_POSITION = 2;

export default function FeedPage({ searchParams }: PageProps<"/feed">) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <Feed searchParams={searchParams} />
    </Suspense>
  );
}

async function Feed({ searchParams }: Pick<PageProps<"/feed">, "searchParams">) {
  const profile = await requireOnboardedProfile();
  const { category: categoryParam } = await searchParams;
  const category = CATEGORY_ORDER.includes(categoryParam as WinCategory) ? (categoryParam as WinCategory) : null;

  const [wins, monthCount] = await Promise.all([
    getFeedWins(profile.user_id, category),
    countWinsThisMonth(profile.user_id, profile.timezone),
  ]);
  const greeting = greetingFor(localHour(profile.timezone));
  const returnTo = category ? `/feed?category=${category}` : "/feed";

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="font-serif text-display">
          {greeting}, {profile.username}.
        </h1>
        <div className="mt-6">
          <QuickAdd username={profile.username} defaultPublic={profile.default_visibility === "public"} />
        </div>
      </header>

      <CategoryFilters active={category} />

      {wins.length === 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <JarCard monthCount={monthCount} />
          <p className="self-center text-ink-muted">
            {category
              ? `No ${CATEGORIES[category].label.toLowerCase()} lights yet. Yours could be the first.`
              : "No lights in the feed yet. Yours could be the first."}
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-6 md:columns-3 lg:columns-4 min-[1400px]:columns-5">
          {wins.map((win, index) => (
            <Fragment key={win.id}>
              {index === JAR_CARD_POSITION && <JarCard monthCount={monthCount} />}
              <WinCard win={win} returnTo={returnTo} className="mb-6" />
            </Fragment>
          ))}
          {wins.length <= JAR_CARD_POSITION && <JarCard monthCount={monthCount} />}
        </div>
      )}

      <footer className="flex flex-col items-center gap-3 py-10 text-center">
        <JarMark className="size-8 text-ink-muted" />
        <p className="font-serif text-title">You&apos;re all caught up</p>
        <p className="text-ink-muted">That&apos;s every light for now. Come back tomorrow for more.</p>
      </footer>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading the feed">
      <div className="h-11 w-80 max-w-full animate-pulse rounded-md bg-surface-raised" />
      <div className="h-14 max-w-2xl animate-pulse rounded-lg bg-surface-raised" />
      <div className="columns-2 gap-6 md:columns-3 lg:columns-4 min-[1400px]:columns-5">
        {[180, 240, 160, 220, 200, 260, 170, 210].map((height, index) => (
          <div key={index} className="mb-6 animate-pulse rounded-lg bg-surface-raised" style={{ height }} />
        ))}
      </div>
    </div>
  );
}
