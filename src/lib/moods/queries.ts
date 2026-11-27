import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isMoodLevel, isMoodTag, type MoodEntry } from "@/lib/mood";

function toEntry(row: { local_date: string; level: number; tags: string[] }): MoodEntry | null {
  if (!isMoodLevel(row.level)) return null;
  return { date: row.local_date, level: row.level, tags: row.tags.filter(isMoodTag) };
}

/** The viewer's check-ins between two local dates, inclusive, oldest first. */
export async function getMoods(userId: string, from: string, to: string): Promise<MoodEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moods")
    .select("local_date, level, tags")
    .eq("user_id", userId)
    .gte("local_date", from)
    .lte("local_date", to)
    .order("local_date");
  if (error) throw error;
  return data.map(toEntry).filter((entry) => entry !== null);
}

/** The viewer's most recent check-ins, newest first. */
export async function getRecentMoods(userId: string, count: number): Promise<MoodEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moods")
    .select("local_date, level, tags")
    .eq("user_id", userId)
    .order("local_date", { ascending: false })
    .limit(count);
  if (error) throw error;
  return data.map(toEntry).filter((entry) => entry !== null);
}
