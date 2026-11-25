import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WinComposer } from "@/components/wins/win-composer";

export const metadata: Metadata = { title: "Offline" };

// Fully static: the service worker caches this page and serves it whenever a
// page can't load, so it must not depend on the session or the database.
export default function OfflinePage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-18 max-w-2xl items-center px-4 md:px-8">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 md:px-8">
        <div>
          <p className="inline-flex items-center gap-2 text-label text-ink-muted">
            <WifiOff className="size-4" strokeWidth={1.75} aria-hidden="true" />
            No connection right now
          </p>
          <h1 className="mt-2 font-serif text-display">Your jar is still here.</h1>
          <p className="mt-3 text-ink-muted">
            You can still write today&apos;s win. It waits on this device and goes into your jar when you&apos;re back
            online.
          </p>
        </div>

        <WinComposer
          username={null}
          initial={{ text: "", emoji: null, category: "mind", isPublic: false }}
          showIdeas={false}
        />

        <Link href="/feed" className="w-fit text-label text-ink-muted underline underline-offset-4 hover:text-ink">
          Try loading Glowjar again
        </Link>
      </main>
    </div>
  );
}
