import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Settings } from "lucide-react";
import { JarFilters } from "@/components/jar/jar-filters";
import { JarIllustration } from "@/components/jar/jar-illustration";
import { OnThisDayCard } from "@/components/jar/on-this-day-card";
import { Shelf } from "@/components/jar/shelf";
import { WinCard } from "@/components/wins/win-card";
import { requireOnboardedProfile } from "@/lib/auth";
import { formatMonth, localToday } from "@/lib/dates";
import { getLatestRecapMonth, getOnThisDay, getShelf } from "@/lib/jar/queries";
import { countMyWins, countWinsThisMonth, getMyWins, type JarVisibility } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "My jar" };

export default function JarPage({ searchParams }: PageProps<"/jar">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-raised" />}>
      <Jar searchParams={searchParams} />
    </Suspense>
  );
}

function parseVisibility(value: string | string[] | undefined): JarVisibility {
  return value === "public" || value === "private" ? value : "all";
}

async function Jar({ searchParams }: Pick<PageProps<"/jar">, "searchParams">) {
  const profile = await requireOnboardedProfile();
  const params = await searchParams;
  const visibility = parseVisibility(params.show);
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  const [wins, altogether, monthCount, shelf, onThisDay, latestRecap] = await Promise.all([
    getMyWins(profile.user_id, { visibility, search }),
    countMyWins(profile.user_id),
    countWinsThisMonth(profile.user_id, profile.timezone),
    getShelf(),
    getOnThisDay(),
    getLatestRecapMonth(profile.user_id),
  ]);
  const thisMonth = formatMonth(localToday(profile.timezone));

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-pill bg-dusk font-serif text-title text-on-dusk"
        >
          {profile.username.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-display">{profile.username}</h1>
          <p className="text-ink-muted">
            {altogether === 1 ? "1 light in your jar altogether" : `${altogether} lights in your jar altogether`}
          </p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-ink-muted transition-colors duration-200 hover:text-ink"
        >
          <Settings className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-label={`Your ${thisMonth} jar`}
          className="flex items-center gap-6 rounded-lg bg-dusk p-7 text-on-dusk shadow-card"
        >
          <div className="relative shrink-0">
            <div aria-hidden="true" className="jar-halo absolute -inset-4 rounded-pill" />
            <JarIllustration lights={monthCount} className="relative h-48 w-auto" />
          </div>
          <div>
            <p className="text-label opacity-80">{thisMonth}</p>
            <p className="mt-1 font-serif text-title">
              {monthCount === 0
                ? "Ready for its first light"
                : `${monthCount} ${monthCount === 1 ? "light" : "lights"} so far`}
            </p>
            <Link
              href="/new"
              className="mt-6 inline-flex min-h-12 items-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card"
            >
              Add a win
            </Link>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {onThisDay && <OnThisDayCard win={onThisDay} />}
          {latestRecap && (
            <Link
              href={`/jar/recap/${latestRecap.slice(0, 7)}`}
              className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-line bg-surface-raised p-6 transition-shadow duration-200 hover:shadow-card"
            >
              <span>
                <span className="block text-label text-ink-muted">Monthly recap</span>
                <span className="font-serif text-title">Your {formatMonth(latestRecap)}</span>
              </span>
              <ChevronRight className="size-5 text-ink-muted" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      <section aria-labelledby="shelf-heading" className="flex flex-col gap-4">
        <h2 id="shelf-heading" className="font-serif text-title">
          Your shelf
        </h2>
        <Shelf months={shelf} />
      </section>

      <section aria-labelledby="wins-heading" className="flex flex-col gap-6">
        <h2 id="wins-heading" className="font-serif text-title">
          Your wins
        </h2>
        <JarFilters visibility={visibility} search={search} />

        {wins.length === 0 ? (
          <EmptyWins hasAny={altogether > 0} search={search} />
        ) : (
          <div className="columns-2 gap-6 md:columns-3 lg:columns-4 min-[1400px]:columns-5">
            {wins.map((win, index) => (
              <WinCard key={win.id} win={win} returnTo="/jar" className="mb-6" index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyWins({ hasAny, search }: { hasAny: boolean; search: string }) {
  if (search) {
    return <p className="text-ink-muted">Nothing in your jar matches &ldquo;{search}&rdquo;. Try another word.</p>;
  }
  if (hasAny) {
    return <p className="text-ink-muted">No wins here yet.</p>;
  }
  return (
    <div className="max-w-md">
      <p className="text-ink-muted">Your jar is waiting for its first light.</p>
      <Link
        href="/new"
        className="mt-6 inline-flex min-h-12 items-center rounded-md border border-line px-6 text-label text-ink"
      >
        Write your first win
      </Link>
    </div>
  );
}
