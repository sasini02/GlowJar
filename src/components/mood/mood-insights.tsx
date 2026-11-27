import Link from "next/link";
import { SparkleIcon } from "@/components/ui/icons";
import { monthGlance, moodStyle, tagInsights, winsAndMood, type MoodEntry, type MoodTag } from "@/lib/mood";
import { TAG_ICONS } from "./tag-icons";

const TAG_TINTS: Record<MoodTag, string> = {
  Sleep: "bg-card-lilac",
  Work: "bg-card-butter",
  Friends: "bg-card-peach",
  Family: "bg-card-blush",
  Health: "bg-card-mint",
  Weather: "bg-card-sky",
  "Me time": "bg-card-mint",
};

/** Bright, steady and heavy days this month, as a stacked bar and three tiles. */
export function MonthAtAGlance({ entries }: { entries: MoodEntry[] }) {
  const glance = monthGlance(entries);
  const total = entries.length;
  const tiles = [
    { label: "bright days", count: glance.bright, tint: "bg-card-butter" },
    { label: "steady days", count: glance.steady, tint: "bg-card-sky" },
    { label: "heavy days", count: glance.heavy, tint: "bg-card-lilac" },
  ];
  const bar = [
    { count: glance.bright, color: "#F2B544" },
    { count: glance.steady, color: "#CFE2EC" },
    { count: glance.heavy, color: "#9AAAD4" },
  ];

  return (
    <section
      aria-labelledby="glance-heading"
      className="flex flex-col gap-3 md:h-full md:gap-3.5 md:rounded-[28px] md:bg-surface-raised md:p-6 md:shadow-card"
    >
      <h2 id="glance-heading" className="font-serif text-[20px] leading-[26px] font-semibold">
        <span className="md:hidden">Your month at a glance</span>
        <span className="hidden md:inline">Month at a glance</span>
      </h2>
      {total === 0 ? (
        <p className="text-label font-normal text-ink-muted">Your first check-in this month will show up here.</p>
      ) : (
        <>
          <div aria-hidden="true" className="flex h-3.5 gap-[3px] overflow-hidden rounded-pill">
            {bar.map((part, index) =>
              part.count > 0 ? (
                <span key={index} style={{ width: `${(part.count / total) * 100}%`, backgroundColor: part.color }} />
              ) : null,
            )}
          </div>
          <ul className="grid grid-cols-3 gap-2.5">
            {tiles.map((tile) => (
              <li key={tile.label} className={`rounded-[18px] p-3 ${tile.tint}`}>
                <p className="font-serif text-[22px] font-semibold text-ink md:text-[24px]">{tile.count}</p>
                <p className="text-caption font-normal text-ink-muted-tint">{tile.label}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Mood on days with a win against days without, once there's enough to compare fairly. */
export function WinsAndMoodCard({ entries, litDates }: { entries: MoodEntry[]; litDates: ReadonlySet<string> }) {
  const comparison = winsAndMood(entries, litDates);

  return (
    <section
      aria-labelledby="wins-mood-heading"
      className="flex h-full flex-col gap-3.5 rounded-[24px] bg-[#34406B] p-5 text-[#FBF7F0] md:rounded-[28px] md:p-6"
    >
      <h2
        id="wins-mood-heading"
        className="flex items-center gap-2 text-caption font-semibold tracking-[0.06em] text-[#F7D48C] uppercase"
      >
        <SparkleIcon className="size-4" />
        Wins and mood
      </h2>
      {comparison ? (
        <>
          <p className="font-serif text-[19px] leading-[27px]">
            {comparison.litAverage > comparison.unlitAverage
              ? "On days you added a win, your mood was a little brighter."
              : comparison.litAverage < comparison.unlitAverage
                ? "Wins showed up on your harder days too. That counts."
                : "Your mood was about the same either way."}
          </p>
          <div className="grid grid-cols-2 gap-2.5 md:mt-auto">
            <MiniOrb level={comparison.litAverage} caption="With a win" />
            <MiniOrb level={comparison.unlitAverage} caption="Without" />
          </div>
        </>
      ) : (
        <p className="font-serif text-[19px] leading-[27px]">Keep checking in. Insights appear after a week or two.</p>
      )}
    </section>
  );
}

function MiniOrb({ level, caption }: { level: number; caption: string }) {
  const { label, color } = moodStyle(level);
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] bg-white/8 p-3">
      <span
        aria-hidden="true"
        className="size-8 shrink-0 rounded-pill"
        style={{ background: `radial-gradient(circle at 38% 32%, #FFFFFF 0%, ${color} 68%)` }}
      />
      <div>
        <p className="text-caption font-normal text-[#C9CDE3]">{caption}</p>
        <p className="text-label font-bold">{label}</p>
      </div>
    </div>
  );
}

/** Tags that clearly lift the month's mood, or are worth keeping an eye on. */
export function WhatShapesYourMood({ entries }: { entries: MoodEntry[] }) {
  const insights = tagInsights(entries);

  return (
    <section
      aria-labelledby="shapes-heading"
      className="flex flex-col gap-3 md:h-full md:gap-1.5 md:rounded-[28px] md:bg-surface-raised md:p-6 md:shadow-card"
    >
      <h2 id="shapes-heading" className="font-serif text-[20px] leading-[26px] font-semibold md:mb-1.5">
        What shapes your mood
      </h2>
      {insights.length === 0 ? (
        <p className="text-label font-normal text-ink-muted">Add a tag or two when you check in, and patterns will show up here.</p>
      ) : (
        <ul className="flex flex-col rounded-[24px] bg-surface-raised px-4 py-1.5 shadow-card md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          {insights.map((insight) => {
            const Icon = TAG_ICONS[insight.tag];
            return (
              <li key={insight.tag} className="flex items-center gap-3 border-b border-[#F1EADF] py-3 last:border-b-0 md:py-2.5">
                <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-[12px] text-[#2A2D3A] ${TAG_TINTS[insight.tag]}`}>
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{insight.tag}</p>
                  <p className="text-caption font-normal text-ink-muted">
                    <span className="md:hidden">Tagged on </span>
                    {insight.days} days
                  </p>
                </div>
                <span className={`text-[13px] font-bold ${insight.effect === "lifts" ? "text-sage-ink" : "text-dusk-ink"}`}>
                  {insight.effect === "lifts" ? "Lifts you" : "Worth watching"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** A gentle offer of the Hard Day screen after a few heavy check-ins. Never styled as a warning. */
export function HardDayCard({ lights }: { lights: number }) {
  return (
    <section aria-labelledby="hard-day-heading" className="flex items-center gap-3.5 rounded-[24px] bg-card-sky p-[18px]">
      <svg width="44" height="52" viewBox="0 0 120 140" aria-hidden="true" className="shrink-0">
        <rect x="44" y="6" width="32" height="14" rx="4" fill="#C99A5B" />
        <path d="M30 26h60a14 14 0 0 1 14 14v74a20 20 0 0 1-20 20H36a20 20 0 0 1-20-20V40a14 14 0 0 1 14-14z" fill="#34406B" />
        <circle cx="60" cy="80" r="20" fill="#F2B544" />
        <circle cx="69" cy="73" r="17" fill="#34406B" />
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="hard-day-heading" className="font-serif text-[17px] leading-[23px] font-semibold text-ink">
          Heavy week?
        </h2>
        <p className="text-[13px] leading-[18px] text-ink-muted-tint">
          Your jar saved {lights} {lights === 1 ? "light" : "lights"} for days like this.
        </p>
      </div>
      <Link href="/hard-day" className="-my-0.5 shrink-0 rounded-pill py-0.5">
        <span className="inline-flex h-10 items-center rounded-pill bg-[#34406B] px-3.5 text-[13px] font-semibold text-[#FBF7F0]">
          Open
        </span>
      </Link>
    </section>
  );
}
