"use server";

import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CELEBRATION_ORDER, type CelebrationType } from "@/lib/celebrations";

/** Sets, changes or (with null) removes the signed-in user's one celebration on a win. */
export async function setCelebration(winId: string, type: CelebrationType | null): Promise<{ error: string | null }> {
  const userId = await requireUserId();
  if (type !== null && !CELEBRATION_ORDER.includes(type)) return { error: "Unknown celebration." };

  const supabase = await createClient();

  if (type === null) {
    const { error } = await supabase.from("celebrations").delete().eq("win_id", winId).eq("user_id", userId);
    return { error: error ? "We couldn't undo that just now." : null };
  }

  // Not an upsert: users may only update `type`, and an upsert would also write the key columns.
  const { data: updated, error: updateError } = await supabase
    .from("celebrations")
    .update({ type })
    .eq("win_id", winId)
    .eq("user_id", userId)
    .select("win_id");

  if (updateError) return { error: "We couldn't save that just now." };
  if (updated.length) return { error: null };

  const { error: insertError } = await supabase.from("celebrations").insert({ win_id: winId, user_id: userId, type });
  if (insertError) {
    console.error("setCelebration failed", insertError.code, insertError.message);
    return { error: "We couldn't save that just now." };
  }
  return { error: null };
}
