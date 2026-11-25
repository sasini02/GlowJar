import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { FeelingCheck } from "@/components/wins/feeling-check";
import { requireOnboardedProfile } from "@/lib/auth";
import { daysBetween, formatLongDate, localToday } from "@/lib/dates";
import { getLetter } from "@/lib/letters/queries";

export const metadata: Metadata = { title: "Letter" };

export default function LetterPage({ params, searchParams }: PageProps<"/letters/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse rounded-lg bg-surface-raised" />}>
      <Letter params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Letter({ params, searchParams }: Pick<PageProps<"/letters/[id]">, "params" | "searchParams">) {
  const profile = await requireOnboardedProfile();
  const { id } = await params;
  const { sealed: justSealed } = await searchParams;
  const letter = await getLetter(profile.user_id, id, profile.timezone);
  if (!letter) notFound();

  if (!letter.isOpen || letter.body === null) {
    const daysToGo = daysBetween(localToday(profile.timezone), letter.deliverOn);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10 text-center">
        <div className="relative w-full overflow-hidden rounded-lg bg-dusk px-8 pt-20 pb-10 text-on-dusk shadow-lift">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24 bg-on-dusk/10 [clip-path:polygon(0_0,100%_0,50%_100%)]"
          />
          <span
            aria-hidden="true"
            className="relative mx-auto flex size-12 items-center justify-center rounded-pill bg-glow text-on-glow shadow-card"
          >
            <Lock className="size-5" strokeWidth={1.75} />
          </span>
          <p className="relative mt-6 font-serif text-title">Sealed until {formatLongDate(letter.deliverOn)}</p>
          <p className="relative mt-2 text-label opacity-80">
            {daysToGo === 1 ? "1 day to go." : `${daysToGo} days to go.`} Not even you can open it before then.
          </p>
        </div>
        {justSealed === "1" && (
          <p role="status" className="text-ink-muted">
            Your letter is sealed. We&apos;ll email it to you and unlock it here on {formatLongDate(letter.deliverOn)}.
          </p>
        )}
        <Link href="/letters" className="inline-flex min-h-12 items-center rounded-md border border-line px-6 text-label text-ink">
          Back to letters
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 md:-mx-8">
      <div className="bg-dusk px-4 pt-10 pb-40 text-on-dusk md:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-label opacity-80">A letter from you</p>
          <h1 className="mt-2 font-serif text-display">Written on {formatLongDate(letter.writtenOn)}</h1>
        </div>
      </div>
      <div className="mx-auto -mt-32 max-w-2xl px-4 md:px-0">
        <article className="lined-paper rounded-lg px-7 py-[14px] shadow-lift">
          <p className="font-serif text-win-text break-words whitespace-pre-line text-ink">{letter.body}</p>
        </article>
        <div className="mt-10 flex flex-col gap-8">
          <FeelingCheck
            question="How does it feel?"
            options={[
              { emoji: "🙂", label: "Good" },
              { emoji: "😌", label: "Calm" },
              { emoji: "🥹", label: "Moved" },
            ]}
            thanks="Thank you for reading it. Past you would be glad."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/letters/new"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card"
            >
              Write back
            </Link>
            <Link
              href="/letters"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-6 text-label text-ink"
            >
              Back to letters
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
