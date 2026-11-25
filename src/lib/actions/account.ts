"use server";

import { redirect } from "next/navigation";
import { getProfile, requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error: string | null };

/**
 * Deletes the auth user. Every table references profiles, which references
 * auth.users, with on delete cascade, so wins, celebrations, letters, recaps,
 * push subscriptions, reports and reminder history all go with it.
 */
export async function deleteAccount(_previous: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const userId = await requireUserId();
  const profile = await getProfile();

  // Typing the username is the confirmation; it's a deliberate step, not a click.
  const typed = String(formData.get("confirm") ?? "").trim();
  if (!profile || typed.toLowerCase() !== profile.username.toLowerCase()) {
    return { error: "Type your name exactly as it's shown to confirm." };
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) {
    console.error("deleteAccount failed", error.status, error.message);
    return { error: "We couldn't delete your account just now. Nothing was removed. Please try again." };
  }

  // The session belongs to a user that no longer exists; clear its cookies.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?deleted=1");
}
