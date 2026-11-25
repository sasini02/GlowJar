import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecapImageButton } from "@/components/jar/recap-image-button";
import { requireOnboardedProfile } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { addMonths, formatMonth, localToday } from "@/lib/dates";
import { getRecap } from "@/lib/jar/queries";

export const metadata: Metadata = { title: "Monthly recap" };

const MONTH_PARAM = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function RecapPage({ params }: PageProps<"/jar/recap/[month]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-[32rem] max-w-2xl animate-pulse rounded-lg bg-surface-raised" />}>
      <RecapContent params={params} />
    </Suspense>
  );
}

async function RecapContent({ params }: Pick<PageProps<"/jar/recap/[month]">, "params">) {
  const { month: monthParam } = await params;
  if (!MONTH_PARAM.test(monthParam)) notFound();

  const profile = await requireOnboardedProfile();
  const month = `${monthParam}-01`;
  const recap = await getRecap(profile.user_id, month);
  if (!recap) notFound();

  const today = localToday(profile.timezone);
  const nextMonth = addMonths(month, 1);
  const isLatest = nextMonth.slice(0, 7) === today.slice(0, 7);
  const sameYear = month.slice(0, 4) === today.slice(0, 4);
  const title = `Your ${formatMonth(month, { withYear: !sameYear })}`;
  const most = recap.byCategory[0]?.lights ?? 1;

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="rounded-lg bg-dusk p-8 text-on-dusk shadow-card">
        <p className="text-label opacity-80">Monthly recap</p>
        <h1 className="mt-1 font-serif text-display">{title}</h1>
        <p className="mt-6 font-serif text-[64px] leading-none text-glow">{recap.total}</p>
        <p className="mt-2">
          {recap.total === 1 ? "light in your jar. That one counts." : "little lights in your jar. Every one of them counts."}
        </p>
      </header>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="font-serif text-title">
          Where your lights came from
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {recap.byCategory.map(({ category, lights }) => (
            <li key={category} className="grid grid-cols-[6rem_minmax(0,1fr)_2rem] items-center gap-3 text-label">
              <span className="text-ink">{CATEGORIES[category].label}</span>
              <span className="h-4 overflow-hidden rounded-pill bg-surface-raised">
                <span
                  className={`block h-full rounded-pill ${CATEGORIES[category].tint} ring-1 ring-line ring-inset`}
                  style={{ width: `${Math.max(8, (lights / most) * 100)}%` }}
                />
              </span>
              <span className="text-right text-ink-muted">{lights}</span>
            </li>
          ))}
        </ul>
      </section>

      {recap.topWin && (
        <section aria-labelledby="top-win-heading">
          <h2 id="top-win-heading" className="font-serif text-title">
            Your most-celebrated light
          </h2>
          <div className={`mt-4 rounded-lg p-7 shadow-card ${CATEGORIES[recap.topWin.category].tint}`}>
            {recap.topWin.emoji && <p className="mb-3 text-win-emoji">{recap.topWin.emoji}</p>}
            <p className="font-serif text-win-text break-words whitespace-pre-line text-ink">{recap.topWin.text}</p>
          </div>
          <p className="mt-3 px-1 text-label text-ink-muted">
            Celebrated {recap.topWin.celebrations === 1 ? "once" : `${recap.topWin.celebrations} times`}. Only you can see this.
          </p>
        </section>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <RecapImageButton
          fileName={`glowjar-${monthParam}.png`}
          title={title}
          total={recap.total}
          byCategory={recap.byCategory.map(({ category, lights }) => ({
            label: CATEGORIES[category].label,
            cssVar: CATEGORIES[category].cssVar,
            lights,
          }))}
          topWin={recap.topWin ? { text: recap.topWin.text, emoji: recap.topWin.emoji } : null}
        />
        {isLatest ? (
          <Link
            href="/new"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card"
          >
            Start {formatMonth(nextMonth)}
          </Link>
        ) : (
          <Link
            href="/jar"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card"
          >
            Back to my jar
          </Link>
        )}
      </div>
    </article>
  );
}
