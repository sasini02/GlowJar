import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_ORDER, type WinCategory } from "@/lib/categories";

export type ShelfMonth = { month: string; lights: number };

export type OnThisDayWin = {
  id: string;
  text: string;
  emoji: string | null;
  category: WinCategory;
  createdAt: string;
  monthsAgo: number;
};

export type Recap = {
  month: string;
  total: number;
  byCategory: { category: WinCategory; lights: number }[];
  topWin: { text: string; emoji: string | null; category: WinCategory; celebrations: number } | null;
};

/** Past months with their light counts, newest first. The current month stays in the jar. */
export async function getShelf(): Promise<ShelfMonth[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("jar_shelf");
  if (error) throw error;
  return data;
}

export async function getOnThisDay(): Promise<OnThisDayWin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("on_this_day");
  if (error) throw error;
  const row = data[0];
  if (!row) return null;
  return {
    id: row.win_id,
    text: row.text,
    emoji: row.emoji,
    category: row.category,
    createdAt: row.created_at,
    monthsAgo: row.months_ago,
  };
}

export async function getLatestRecapMonth(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_recaps")
    .select("month")
    .eq("user_id", userId)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.month ?? null;
}

/** `month` is the first day of the month, "YYYY-MM-01". */
export async function getRecap(userId: string, month: string): Promise<Recap | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_recaps")
    .select("month, total, by_category, top_win_celebrations, top_win:wins(text, emoji, category)")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const counts = data.by_category as Partial<Record<WinCategory, number>>;
  const byCategory = CATEGORY_ORDER.filter((category) => counts[category])
    .map((category) => ({ category, lights: counts[category] ?? 0 }))
    .sort((a, b) => b.lights - a.lights);

  return {
    month: data.month,
    total: data.total,
    byCategory,
    topWin: data.top_win ? { ...data.top_win, celebrations: data.top_win_celebrations } : null,
  };
}
