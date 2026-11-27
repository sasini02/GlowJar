"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { checkPublicWin } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { parseWinInput, type WinInput } from "@/lib/wins/validation";

export type WinFormState = {
  error: string | null;
  /** Set when a win was saved without leaving the page (the composers on Home). */
  savedAt?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// SQLSTATE raised by the wins_rate_limit trigger; its message is written for people.
const RATE_LIMITED = "GJ429";

/** Private wins are never moderated: it's someone's own diary. Public ones are checked first. */
async function moderationError(text: string, isPublic: boolean): Promise<string | null> {
  if (!isPublic) return null;
  const result = await checkPublicWin(text);
  return result.allowed ? null : (result.message ?? "This one can't be shared publicly, but you can keep it just for you.");
}

type InsertResult = { id: string } | { error: string };

async function insertWin(userId: string, { text, emoji, category, isPublic }: WinInput): Promise<InsertResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wins")
    .insert({ user_id: userId, text, emoji, category, is_public: isPublic })
    .select("id")
    .single();

  if (error) {
    if (error.code === RATE_LIMITED) return { error: error.message };
    console.error("insertWin failed", error.code, error.message);
    return { error: "We couldn't save your win just now. Your words are still here, so try again in a moment." };
  }
  return { id: data.id };
}

export async function createWin(_previous: WinFormState, formData: FormData): Promise<WinFormState> {
  const userId = await requireUserId();
  const parsed = parseWinInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const blocked = await moderationError(parsed.data.text, parsed.data.isPublic);
  if (blocked) return { error: blocked };

  const result = await insertWin(userId, parsed.data);
  if ("error" in result) return { error: result.error };

  // Home keeps the writer where they are, so the streak lights up in place.
  if (formData.get("stay") === "1") {
    refresh();
    return { error: null, savedAt: Date.now() };
  }

  redirect(`/wins/${result.id}/added`);
}

export type QueuedWinResult =
  | { status: "saved" }
  /** Saved, but as Just me, because the public version didn't pass moderation. */
  | { status: "saved_private"; message: string }
  | { status: "retry" }
  /** Can never be saved as written (for example too long); the device should drop it. */
  | { status: "invalid"; message: string };

/**
 * Saves a win that was written offline and queued on the device. The writer
 * isn't looking at a form any more, so a public win that fails moderation is
 * kept as Just me rather than lost, and the writer is told why.
 */
export async function saveQueuedWin(input: WinInput): Promise<QueuedWinResult> {
  const userId = await requireUserId();

  const formData = new FormData();
  formData.set("text", input.text);
  formData.set("emoji", input.emoji ?? "");
  formData.set("category", input.category);
  formData.set("visibility", input.isPublic ? "public" : "private");
  const parsed = parseWinInput(formData);
  if ("error" in parsed) return { status: "invalid", message: parsed.error };

  let win = parsed.data;
  const blocked = await moderationError(win.text, win.isPublic);
  if (blocked) win = { ...win, isPublic: false };

  const result = await insertWin(userId, win);
  if ("error" in result) return { status: "retry" };

  refresh();
  return blocked ? { status: "saved_private", message: blocked } : { status: "saved" };
}

export async function updateWin(_previous: WinFormState, formData: FormData): Promise<WinFormState> {
  await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { error: "We couldn't find that win." };

  const parsed = parseWinInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { text, emoji, category, isPublic } = parsed.data;
  const blocked = await moderationError(text, isPublic);
  if (blocked) return { error: blocked };

  const supabase = await createClient();
  // RLS limits updates to the author's own rows, so a missing row means "not yours" or "gone".
  const { data, error } = await supabase
    .from("wins")
    .update({ text, emoji, category, is_public: isPublic })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("updateWin failed", error.code, error.message);
    return { error: "We couldn't save your changes just now. Please try again." };
  }
  if (!data.length) return { error: "We couldn't find that win." };

  redirect(safeReturnPath(formData.get("returnTo")));
}

export async function deleteWin(id: string): Promise<{ error: string | null }> {
  await requireUserId();
  if (!UUID.test(id)) return { error: "We couldn't find that win." };

  const supabase = await createClient();
  const { error } = await supabase.from("wins").delete().eq("id", id);
  if (error) {
    console.error("deleteWin failed", error.code, error.message);
    return { error: "We couldn't delete that just now. Please try again." };
  }

  refresh();
  return { error: null };
}

/** Only allow same-site paths, so a crafted form can't bounce people to another site. */
function safeReturnPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/jar";
}
