import { milestoneFor, nextMilestone } from "@/lib/milestones";

function ProgressBar({ current, next }: { current: number; next: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`Progress to the ${next}-day glow`}
      aria-valuemin={0}
      aria-valuemax={next}
      aria-valuenow={current}
      className="h-2.5 overflow-hidden rounded-pill bg-[#F1EADF]"
    >
      <div className="bar-grow h-full rounded-pill bg-[#F2B544]" style={{ width: `${Math.min(100, Math.round((current / next) * 100))}%` }} />
    </div>
  );
}

/** The next streak milestone as its own card on phones. */
export function NextMilestone({ current }: { current: number }) {
  const next = nextMilestone(current);
  return (
    <section aria-label="Next milestone" className="flex flex-col gap-2.5 rounded-[20px] bg-surface-raised p-4 shadow-card">
      {next === null ? (
        <p className="text-label font-semibold">Every glow unlocked. Keep collecting little lights.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span className="text-label font-semibold">Next glow: {next} days</span>
            <span className="text-caption font-medium text-ink-muted">
              {next - current} {next - current === 1 ? "day" : "days"} to go
            </span>
          </div>
          <ProgressBar current={current} next={next} />
          <span className="text-caption font-normal text-ink-muted">Unlocks a new jar style for your profile.</span>
        </>
      )}
    </section>
  );
}

/** The same, sized as the fourth stat tile on wider screens. */
export function NextMilestoneTile({ current }: { current: number }) {
  const next = nextMilestone(current);
  return (
    <div className="flex w-full flex-col justify-center gap-2 rounded-[22px] bg-surface-raised p-[18px] shadow-card">
      {next === null ? (
        <p className="text-[13px] font-semibold">Every glow unlocked</p>
      ) : (
        <>
          <div className="flex justify-between text-[13px]">
            <span className="font-semibold">Next glow: {next} days</span>
            <span className="text-ink-muted">{next - current} to go</span>
          </div>
          <ProgressBar current={current} next={next} />
          <span className="text-caption font-normal text-ink-muted">Unlocks the {milestoneFor(next)?.reward}</span>
        </>
      )}
    </div>
  );
}
