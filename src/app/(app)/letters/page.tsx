import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { DeliveredLetterCard, SealedEnvelope } from "@/components/letters/letter-cards";
import { LetterComposer } from "@/components/letters/letter-composer";
import { requireOnboardedProfile } from "@/lib/auth";
import { localToday } from "@/lib/dates";
import { getLetters } from "@/lib/letters/queries";

export const metadata: Metadata = { title: "Letters" };

export default function LettersPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-raised" />}>
      <Letters />
    </Suspense>
  );
}

async function Letters() {
  const profile = await requireOnboardedProfile();
  const letters = await getLetters(profile.user_id, profile.timezone);
  const today = localToday(profile.timezone);
  const sealed = letters.filter((letter) => !letter.isOpen);
  const delivered = letters.filter((letter) => letter.isOpen).reverse();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
      <div className="flex flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-display">Letters</h1>
            <p className="mt-2 text-ink-muted">Notes to your future self, sealed until the day you choose.</p>
          </div>
          <Link
            href="/letters/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-md bg-glow px-6 text-label text-on-glow shadow-card lg:hidden"
          >
            <PenLine className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Write a letter
          </Link>
        </header>

        <section aria-labelledby="sealed-heading">
          <h2 id="sealed-heading" className="font-serif text-title">
            Sealed
          </h2>
          {sealed.length === 0 ? (
            <p className="mt-2 text-ink-muted">No letters on their way yet. Write one, and it will find you later.</p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {sealed.map((letter) => (
                <SealedEnvelope key={letter.id} letter={letter} today={today} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="delivered-heading">
          <h2 id="delivered-heading" className="font-serif text-title">
            Delivered
          </h2>
          {delivered.length === 0 ? (
            <p className="mt-2 text-ink-muted">Letters you open will live here.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {delivered.map((letter) => (
                <DeliveredLetterCard key={letter.id} letter={letter} />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside aria-labelledby="write-heading" className="hidden rounded-lg bg-surface-raised p-8 shadow-lift lg:block">
        <h2 id="write-heading" className="mb-6 font-serif text-title">
          Write to your future self
        </h2>
        <LetterComposer today={today} />
      </aside>
    </div>
  );
}
