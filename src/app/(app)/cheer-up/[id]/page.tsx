import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FeelingCheck } from "@/components/wins/feeling-check";
import { WinTile } from "@/components/wins/win-tile";
import { requireOnboardedProfile } from "@/lib/auth";
import { getOwnWin } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "A little light from your jar" };

const KIND_LINES = [
  "You were braver than you felt.",
  "Look how far you've come.",
  "This was you. It still is.",
  "Small things add up. This one did.",
];

// Opened from a cheer-up notification: one of the user's own past wins, given back.
export default function CheerUpPage({ params }: PageProps<"/cheer-up/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-80 max-w-xl animate-pulse rounded-lg bg-surface-raised" />}>
      <CheerUp params={params} />
    </Suspense>
  );
}

async function CheerUp({ params }: Pick<PageProps<"/cheer-up/[id]">, "params">) {
  const profile = await requireOnboardedProfile();
  const { id } = await params;
  const win = await getOwnWin(profile.user_id, id);

  if (!win) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <h1 className="font-serif text-display">This light has moved on.</h1>
        <p className="mt-3 text-ink-muted">The win from this reminder isn&apos;t in your jar anymore. Plenty of others are.</p>
        <Link href="/jar" className="mt-8 inline-flex min-h-12 items-center rounded-md bg-glow px-6 text-label text-ink shadow-card">
          Open my jar
        </Link>
      </div>
    );
  }

  const writtenOn = new Date(win.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: profile.timezone,
  });
  // Stable per win, so a reload doesn't change the words.
  const line = KIND_LINES[win.id.charCodeAt(0) % KIND_LINES.length];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <header>
        <p className="text-label text-glow-ink">A little light from your jar</p>
        <h1 className="mt-2 font-serif text-display">{line}</h1>
        <p className="mt-2 text-ink-muted">You wrote this on {writtenOn}.</p>
      </header>

      <WinTile text={win.text} emoji={win.emoji} category={win.category} />

      <FeelingCheck
        question="How does this feel now?"
        options={[
          { emoji: "🙂", label: "Good" },
          { emoji: "😌", label: "Calm" },
          { emoji: "🥹", label: "Moved" },
        ]}
        thanks="Thank you for noticing. That's a small win too."
      />

      <Link
        href="/new"
        className="inline-flex min-h-12 w-fit items-center rounded-md bg-glow px-6 text-label text-ink shadow-card transition-shadow duration-200 hover:shadow-lift"
      >
        Add today&apos;s win
      </Link>
    </div>
  );
}
