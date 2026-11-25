import type { Metadata } from "next";
import { Suspense } from "react";
import { LetterComposer } from "@/components/letters/letter-composer";
import { requireOnboardedProfile } from "@/lib/auth";
import { localToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Write a letter" };

export default function NewLetterPage() {
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="font-serif text-display">Write to your future self</h1>
      <p className="mt-2 mb-8 text-ink-muted">What would you like to remember, or to hear, when this arrives?</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-raised" />}>
        <Composer />
      </Suspense>
    </section>
  );
}

async function Composer() {
  const profile = await requireOnboardedProfile();
  return <LetterComposer today={localToday(profile.timezone)} />;
}
