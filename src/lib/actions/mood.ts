"use server";

import { requireUserId } from "@/lib/auth";
import { isMoodLevel, isMoodTag } from "@/lib/mood";
import { createClient } from "@/lib/supabase/server";

/**
 * Saves today's mood, or updates it. Leave `tags` out to keep any tags already
 * saved today (the one-tap pick on Home only changes the level).
 */
export async function saveMood(level: number, tags?: string[]): Promise<{ error: string | null }> {
  await requireUserId();
  if (!isMoodLevel(level)) return { error: "Pick a point on the scale." };
  if (tags && !tags.every(isMoodTag)) return { error: "One of those tags isn't one we know." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_mood", {
    mood_level: level,
    ...(tags ? { mood_tags: [...new Set(tags)] } : {}),
  });
  if (error) {
    console.error("saveMood failed", error.code, error.message);
    return { error: "We couldn't save that just now. Please try again." };
  }
  return { error: null };
}
