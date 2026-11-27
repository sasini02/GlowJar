import { getUserId } from "@/lib/auth";
import { getLightsToday } from "@/lib/home/queries";

/** "Lights added by everyone today", for the sidebar on Home. Quietly absent if it can't be counted. */
export async function LightsTodayCard() {
  // getUserId waits for the request first; the Supabase client reads the clock, which can't happen while prerendering.
  if (!(await getUserId())) return null;
  const lights = await getLightsToday().catch(() => null);
  if (lights === null) return null;

  return (
    <div className="flex flex-col gap-1 rounded-[20px] bg-surface-raised p-4 shadow-card">
      <span className="font-serif text-[22px] font-semibold text-ink">{lights.toLocaleString("en-GB")}</span>
      <span className="text-[13px] leading-[18px] text-ink-muted">
        {lights === 1 ? "light added by everyone today" : "lights added by everyone today"}
      </span>
    </div>
  );
}
