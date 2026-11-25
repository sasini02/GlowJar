"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseWinInput } from "@/lib/wins/validation";

export type WinFormState = { error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createWin(_previous: WinFormState, formData: FormData): Promise<WinFormState> {
  const userId = await requireUserId();
  const parsed = parseWinInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { text, emoji, category, isPublic } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wins")
    .insert({ user_id: userId, text, emoji, category, is_public: isPublic })
    .select("id")
    .single();

  if (error) {
    console.error("createWin failed", error.code, error.message);
    return { error: "We couldn't save your win just now. Your words are still here, so try again in a moment." };
  }

  redirect(`/wins/${data.id}/added`);
}

export async function updateWin(_previous: WinFormState, formData: FormData): Promise<WinFormState> {
  await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { error: "We couldn't find that win." };

  const parsed = parseWinInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { text, emoji, category, isPublic } = parsed.data;
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
