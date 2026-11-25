import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HardDayViewer } from "@/components/hard-day/hard-day-viewer";
import { Fireflies } from "@/components/hard-day/fireflies";
import { requireOnboardedProfile } from "@/lib/auth";
import { getMyWins } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "Hard day" };

const MAX_WINS = 60;

export default function HardDayPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-dusk px-6 pt-6 pb-10 text-on-dusk">
      <Fireflies />
      <Link
        href="/feed"
        className="relative inline-flex min-h-11 w-fit items-center gap-2 rounded-pill px-3 text-label text-on-dusk/90 hover:text-on-dusk"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Back to Glowjar
      </Link>

      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">
        <h1 className="text-center font-serif text-display">You&apos;ve done hard things before.</h1>
        <Suspense fallback={<div className="mt-10 h-56 animate-pulse rounded-lg bg-on-dusk/10" />}>
          <PastWins />
        </Suspense>
      </div>

      <p className="relative mx-auto max-w-md text-center text-label text-on-dusk/90">
        If things feel like too much, you don&apos;t have to carry them alone.{" "}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-on-dusk underline underline-offset-4"
        >
          Find support near you
        </a>
      </p>
    </main>
  );
}

async function PastWins() {
  const profile = await requireOnboardedProfile();
  const wins = await getMyWins(profile.user_id);
  const shuffled = shuffle(wins).slice(0, MAX_WINS);
  return (
    <HardDayViewer
      wins={shuffled.map(({ id, text, emoji, category, createdAt }) => ({
        id,
        text,
        emoji,
        category,
        writtenOn: new Date(createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: profile.timezone,
        }),
      }))}
    />
  );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
