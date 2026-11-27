import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_ORDER, type WinCategory } from "@/lib/categories";
import { addDays, startOfMonth } from "@/lib/dates";
import { newlyReached } from "@/lib/milestones";

// Far enough back to cover every milestone with room to spare. A longer streak
// shows as this many days, while best_streak keeps the true record.
const STREAK_LOOKBACK_DAYS = 400;

/** Local dates on which the viewer added at least one win, back far enough to work out the streak. */
export async function getLitDates(today: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_lit_dates", { since: addDays(today, -STREAK_LOOKBACK_DAYS) });
  if (error) throw error;
  return new Set(data);
}

export type MonthCategories = { total: number; byCategory: { category: WinCategory; lights: number }[] };

/** This month's wins by category, most first. */
export async function getMonthCategories(userId: string, today: string): Promise<MonthCategories> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wins")
    .select("category")
    .eq("user_id", userId)
    .gte("local_date", startOfMonth(today))
    .lte("local_date", today);
  if (error) throw error;

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    lights: data.filter((row) => row.category === category).length,
  }))
    .filter((entry) => entry.lights > 0)
    .sort((a, b) => b.lights - a.lights);

  return { total: data.length, byCategory };
}

/** Wins added by everyone since midnight in the viewer's timezone. Just a number: nothing about who. */
export async function getLightsToday(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lights_today");
  if (error) throw error;
  return data;
}

type StreakRecordInput = { userId: string; bestStreak: number; current: number; today: string };

/**
 * Records new milestones and a new best streak, and returns the milestone to
 * celebrate, if any. This runs when Home renders rather than when a win is
 * posted, because a streak can also reach a milestone overnight, when an unlit
 * day turns into a rest day. Both writes are idempotent.
 */
export async function syncStreakRecords({ userId, bestStreak, current, today }: StreakRecordInput): Promise<number | null> {
  const supabase = await createClient();
  const { data: recorded, error } = await supabase.from("streak_milestones").select("days, seen").eq("user_id", userId);
  if (error) throw error;

  const reached = newlyReached(current, new Set(recorded.map((row) => row.days)));
  if (reached.length > 0) {
    const { error: insertError } = await supabase
      .from("streak_milestones")
      .upsert(
        reached.map((days) => ({ user_id: userId, days, reached_on: today })),
        { onConflict: "user_id,days", ignoreDuplicates: true },
      );
    if (insertError) console.error("Recording milestones failed", insertError.code, insertError.message);
  }

  if (current > bestStreak) {
    const { error: bestError } = await supabase.from("profiles").update({ best_streak: current }).eq("user_id", userId);
    if (bestError) console.error("Updating best streak failed", bestError.code, bestError.message);
  }

  const unseen = [...recorded.filter((row) => !row.seen).map((row) => row.days), ...reached];
  return unseen.length > 0 ? Math.max(...unseen) : null;
}
