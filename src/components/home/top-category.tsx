import { CATEGORIES, type WinCategory } from "@/lib/categories";
import type { MonthCategories } from "@/lib/home/queries";

const CATEGORY_EMOJI: Record<WinCategory, string> = {
  health: "🌿",
  work: "💼",
  social: "🫶",
  mind: "🌙",
  learning: "📚",
  self_care: "🛁",
};

// A deeper shade of each card tint, so the bars read against the cream track.
const BAR_COLORS: Record<WinCategory, string> = {
  health: "#A9C9B2",
  work: "#E8CF7A",
  social: "#F0B79A",
  mind: "#A9C4E8",
  learning: "#C7B8E8",
  self_care: "#E9A9BA",
};

function wins(count: number) {
  return `${count} ${count === 1 ? "win" : "wins"}`;
}

/** "What lit your jar": the top category as a tinted card, then chips (phones) or bars (wider). */
export function TopCategory({ categories }: { categories: MonthCategories }) {
  const [top, ...rest] = categories.byCategory;

  return (
    <section aria-label="What lit your jar" className="h-full">
      {/* Phones: heading outside, card and chips */}
      <div className="flex flex-col gap-3 md:hidden">
        <h2 className="font-serif text-[20px] leading-[26px] font-semibold">What lit your jar</h2>
        {!top ? (
          <p className="text-label font-normal text-ink-muted">Your first light this month will show up here.</p>
        ) : (
          <>
            <div className={`flex items-center gap-3.5 rounded-[24px] p-[18px] ${CATEGORIES[top.category].tint}`}>
              <span aria-hidden="true" className="text-[36px] leading-10">
                {CATEGORY_EMOJI[top.category]}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption font-semibold text-ink-muted-tint">Your top category this month</span>
                <span className="font-serif text-[22px] leading-7 font-semibold text-ink">{CATEGORIES[top.category].longLabel}</span>
                <span className="text-[13px] leading-[18px] text-ink-muted-tint">{wins(top.lights)}</span>
              </div>
            </div>
            {rest.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {rest.map(({ category, lights }) => (
                  <li key={category} className={`rounded-pill px-3 py-2 text-[13px] font-semibold text-ink ${CATEGORIES[category].tint}`}>
                    {CATEGORIES[category].longLabel} · {lights}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Wider: one card with a top tile and bars */}
      <div className="hidden h-full flex-col gap-4 rounded-[28px] bg-surface-raised p-6 shadow-card md:flex">
        <h2 className="font-serif text-[22px] leading-7 font-semibold">What lit your jar</h2>
        {!top ? (
          <p className="text-label font-normal text-ink-muted">Your first light this month will show up here.</p>
        ) : (
          <>
            <div className={`flex items-center gap-3.5 rounded-[20px] p-4 ${CATEGORIES[top.category].tint}`}>
              <span aria-hidden="true" className="text-[32px] leading-9">
                {CATEGORY_EMOJI[top.category]}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption font-semibold text-ink-muted-tint">Top category this month</span>
                <span className="font-serif text-[20px] leading-[26px] font-semibold text-ink">{CATEGORIES[top.category].longLabel}</span>
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {categories.byCategory.map(({ category, lights }, index) => (
                <li key={category} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span>{CATEGORIES[category].longLabel}</span>
                    <span>{lights}</span>
                  </div>
                  <div className="h-2.5 rounded-pill bg-[#F1EADF]">
                    <div
                      className="bar-grow h-2.5 rounded-pill"
                      style={{
                        width: `${Math.max(6, (lights / top.lights) * 100)}%`,
                        backgroundColor: BAR_COLORS[category],
                        ["--rise-delay" as string]: `${index * 60}ms`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
