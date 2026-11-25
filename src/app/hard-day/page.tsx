import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Hard day" };

export default function HardDayPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-dusk px-6 text-center text-on-dusk">
      <h1 className="font-serif text-display">You&apos;ve done hard things before.</h1>
      <p className="mt-4 max-w-md opacity-80">Your past wins will appear here, one at a time.</p>
      <Link href="/feed" className="mt-10 inline-flex min-h-11 items-center rounded-pill px-4 text-label underline underline-offset-4">
        Back to the feed
      </Link>
    </main>
  );
}
