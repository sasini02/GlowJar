import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { WinCard } from "@/components/wins/win-card";
import { requireOnboardedProfile } from "@/lib/auth";
import { countWinsThisMonth, getMyWins } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "My jar" };

// A simple list for now. The jar illustration, shelf of past months and search arrive in Phase 4.
export default function JarPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-raised" />}>
      <Jar />
    </Suspense>
  );
}

async function Jar() {
  const profile = await requireOnboardedProfile();
  const [wins, monthCount] = await Promise.all([
    getMyWins(profile.user_id),
    countWinsThisMonth(profile.user_id, profile.timezone),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-display">My jar</h1>
        <p className="mt-2 text-ink-muted">
          {monthCount === 1 ? "1 light this month." : `${monthCount} lights this month.`}{" "}
          {wins.length > 0 && `${wins.length} in your jar altogether.`}
        </p>
      </header>

      {wins.length === 0 ? (
        <div className="max-w-md">
          <p className="text-ink-muted">Your jar is waiting for its first light.</p>
          <Link
            href="/new"
            className="mt-6 inline-flex min-h-12 items-center rounded-md bg-glow px-6 text-label text-ink shadow-card"
          >
            Add a win
          </Link>
        </div>
      ) : (
        <div className="columns-2 gap-6 md:columns-3 lg:columns-4 min-[1400px]:columns-5">
          {wins.map((win) => (
            <WinCard key={win.id} win={win} returnTo="/jar" className="mb-6" />
          ))}
        </div>
      )}
    </div>
  );
}
