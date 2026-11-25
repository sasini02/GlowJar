import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WinCard } from "@/components/wins/win-card";
import { WinTile } from "@/components/wins/win-tile";
import { requireOnboardedProfile } from "@/lib/auth";
import { countWinsThisMonth, getOwnWin, getWinsToCheer } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "That counts" };

export default function WinAddedPage({ params }: PageProps<"/wins/[id]/added">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-xl animate-pulse rounded-lg bg-surface-raised" />}>
      <WinAdded params={params} />
    </Suspense>
  );
}

async function WinAdded({ params }: Pick<PageProps<"/wins/[id]/added">, "params">) {
  const profile = await requireOnboardedProfile();
  const { id } = await params;

  const [win, monthCount, toCheer] = await Promise.all([
    getOwnWin(profile.user_id, id),
    countWinsThisMonth(profile.user_id, profile.timezone),
    getWinsToCheer(profile.user_id),
  ]);
  if (!win) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative">
        <div aria-hidden="true" className="win-glow absolute -inset-6 rounded-[44px]" />
        <Confetti />
        <WinTile text={win.text} emoji={win.emoji} category={win.category} className="relative" />
      </div>

      <h1 className="mt-10 font-serif text-display">That counts.</h1>
      <p className="mt-2 text-ink-muted">
        One more light in your jar. That&apos;s {monthCount} this month.
        {!win.isPublic && " This one is just for you."}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/new"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card transition-shadow duration-200 hover:shadow-lift"
        >
          Add another
        </Link>
        <Link
          href="/feed"
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-6 text-label text-ink transition-colors duration-200 hover:bg-surface-raised"
        >
          Back to the feed
        </Link>
      </div>

      {toCheer.length > 0 && (
        <section className="mt-14" aria-labelledby="cheer-heading">
          <h2 id="cheer-heading" className="font-serif text-title">
            Cheer someone on
          </h2>
          <p className="mt-1 mb-6 text-ink-muted">A few lights from other people today.</p>
          <div className="columns-1 gap-6 sm:columns-2">
            {toCheer.map((other) => (
              <WinCard key={other.id} win={other} returnTo="/feed" className="mb-6" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CONFETTI_DOTS = [
  { left: "8%", top: "10%", delay: "0ms", color: "bg-glow" },
  { left: "88%", top: "6%", delay: "60ms", color: "bg-coral" },
  { left: "96%", top: "55%", delay: "120ms", color: "bg-glow-soft" },
  { left: "2%", top: "70%", delay: "90ms", color: "bg-coral" },
  { left: "50%", top: "-4%", delay: "30ms", color: "bg-glow" },
  { left: "70%", top: "100%", delay: "150ms", color: "bg-sage" },
  { left: "25%", top: "98%", delay: "180ms", color: "bg-glow-soft" },
];

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {CONFETTI_DOTS.map((dot, index) => (
        <span
          key={index}
          className={`confetti-dot absolute size-2 rounded-pill ${dot.color}`}
          style={{ left: dot.left, top: dot.top, animationDelay: dot.delay }}
        />
      ))}
    </div>
  );
}
