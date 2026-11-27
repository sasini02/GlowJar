"use server";

import { refresh } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { milestoneFor } from "@/lib/milestones";
import { createClient } from "@/lib/supabase/server";

/** Closes a milestone celebration for good and switches the jar to the style it unlocked. */
export async function markMilestoneSeen(days: number): Promise<{ error: string | null }> {
  const userId = await requireUserId();
  const milestone = milestoneFor(days);
  if (!milestone) return { error: "We couldn't find that milestone." };

  const supabase = await createClient();
  // Lower milestones reached in the same jump are celebrated by this one.
  const { error } = await supabase
    .from("streak_milestones")
    .update({ seen: true })
    .eq("user_id", userId)
    .lte("days", days)
    .eq("seen", false);
  if (error) {
    console.error("markMilestoneSeen failed", error.code, error.message);
    return { error: "Something went wrong. Please try again." };
  }

  const { error: styleError } = await supabase.from("profiles").update({ jar_style: milestone.style }).eq("user_id", userId);
  if (styleError) console.error("Setting jar style failed", styleError.code, styleError.message);

  refresh();
  return { error: null };
}
