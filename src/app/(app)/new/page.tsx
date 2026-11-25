import type { Metadata } from "next";
import { Suspense } from "react";
import { WinComposer } from "@/components/wins/win-composer";
import { requireOnboardedProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Add a win" };

export default function NewWinPage() {
  return (
    <section className="mx-auto max-w-xl md:rounded-lg md:bg-surface-raised md:p-8 md:shadow-lift">
      <h1 className="font-serif text-title">Add a win</h1>
      <p className="mt-1 mb-6 text-ink-muted">What went right today, however small?</p>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-surface-raised" />}>
        <NewWinComposer />
      </Suspense>
    </section>
  );
}

async function NewWinComposer() {
  const profile = await requireOnboardedProfile();
  return (
    <WinComposer
      username={profile.username}
      autoFocus
      initial={{ text: "", emoji: null, category: "health", isPublic: profile.default_visibility === "public" }}
    />
  );
}
