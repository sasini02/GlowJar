import "server-only";
import { createClient } from "@/lib/supabase/server";
import { moderateText, type ModerationResult } from "../../supabase/functions/_shared/moderation";

/**
 * Runs the moderate-win Edge Function on text that is about to be shared publicly.
 * If the function can't be reached (not deployed yet, network trouble), the same
 * rules run here instead, so a public win is never saved unchecked.
 */
export async function checkPublicWin(text: string): Promise<ModerationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<ModerationResult>("moderate-win", { body: { text } });

  if (error || !data || typeof data.allowed !== "boolean") {
    if (error) console.warn("moderate-win unavailable, checking locally:", error.message);
    return moderateText(text);
  }
  return data;
}
