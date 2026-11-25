import Link from "next/link";
import { Lock, MailOpen } from "lucide-react";
import { daysBetween, formatLongDate } from "@/lib/dates";
import type { LetterSummary } from "@/lib/letters/queries";

/** An indigo envelope for a letter that's still sealed. */
export function SealedEnvelope({ letter, today }: { letter: LetterSummary; today: string }) {
  const daysToGo = daysBetween(today, letter.deliverOn);
  return (
    <Link
      href={`/letters/${letter.id}`}
      className="group relative block overflow-hidden rounded-lg bg-dusk p-6 text-on-dusk shadow-card transition-shadow duration-200 hover:shadow-lift"
    >
      {/* The envelope flap. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-16 bg-on-dusk/10 transition-transform duration-300 ease-out [clip-path:polygon(0_0,100%_0,50%_100%)] motion-safe:group-hover:-translate-y-1.5"
      />
      <span
        aria-hidden="true"
        className="relative mx-auto flex size-10 items-center justify-center rounded-pill bg-glow text-on-glow shadow-card"
      >
        <Lock className="size-4" strokeWidth={1.75} />
      </span>
      <p className="relative mt-5 text-center font-serif text-title">Opens {formatLongDate(letter.deliverOn)}</p>
      <p className="relative mt-1 text-center text-label opacity-80">
        {daysToGo === 1 ? "1 day to go" : `${daysToGo} days to go`} · written {formatLongDate(letter.writtenOn)}
      </p>
    </Link>
  );
}

/** A letter that has arrived. */
export function DeliveredLetterCard({ letter }: { letter: LetterSummary }) {
  return (
    <Link
      href={`/letters/${letter.id}`}
      className="flex items-center gap-4 rounded-lg bg-surface-raised p-5 shadow-card transition-shadow duration-200 hover:shadow-lift"
    >
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-glow-soft text-ink">
        <MailOpen className="size-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-body text-ink">Arrived {formatLongDate(letter.deliverOn)}</span>
        <span className="block text-caption text-ink-muted">Written {formatLongDate(letter.writtenOn)}</span>
      </span>
    </Link>
  );
}
