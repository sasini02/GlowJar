import "server-only";
import { createClient } from "@/lib/supabase/server";
import { localToday } from "@/lib/dates";

export type LetterSummary = {
  id: string;
  deliverOn: string;
  writtenOn: string;
  deliveredAt: string | null;
  /** Mirrors open_letter(): readable once deliver_on has arrived in the author's timezone. */
  isOpen: boolean;
};

export async function getLetters(userId: string, timezone: string): Promise<LetterSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("letters")
    .select("id, deliver_on, delivered_at, created_at")
    .eq("user_id", userId)
    .order("deliver_on", { ascending: true });
  if (error) throw error;

  const today = localToday(timezone);
  return data.map((row) => toSummary(row, today, timezone));
}

export async function getLetter(userId: string, id: string, timezone: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("letters")
    .select("id, deliver_on, delivered_at, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  const summary = toSummary(data, localToday(timezone), timezone);
  if (!summary.isOpen) return { ...summary, body: null };

  // The database is the real gate: open_letter() refuses until the date arrives.
  const { data: body, error } = await supabase.rpc("open_letter", { letter_id: id });
  if (error) return { ...summary, isOpen: false, body: null };
  return { ...summary, body };
}

function toSummary(
  row: { id: string; deliver_on: string; delivered_at: string | null; created_at: string },
  today: string,
  timezone: string,
): LetterSummary {
  return {
    id: row.id,
    deliverOn: row.deliver_on,
    writtenOn: localToday(timezone, new Date(row.created_at)),
    deliveredAt: row.delivered_at,
    isOpen: row.deliver_on <= today,
  };
}
