import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Pick<
  Tables<"profiles">,
  | "user_id"
  | "username"
  | "timezone"
  | "default_visibility"
  | "nudge_time"
  | "cheerups_enabled"
  | "onboarded_at"
  | "is_moderator"
  | "theme"
  | "quiet_start"
  | "quiet_end"
  | "best_streak"
  | "jar_style"
  | "glow_reminders_enabled"
>;

/** The signed-in user's id, or null. Cached for the length of one request. */
export const getUserId = cache(async (): Promise<string | null> => {
  // Session checks compare token expiry with the clock, so they must run per request, never at prerender.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
});

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/");
  return userId;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "user_id, username, timezone, default_visibility, nudge_time, cheerups_enabled, onboarded_at, is_moderator, theme, quiet_start, quiet_end, best_streak, jar_style, glow_reminders_enabled",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return data;
});

/** For app screens: sends visitors to sign in and new users to the set-up screen. */
export async function requireOnboardedProfile(): Promise<Profile> {
  await requireUserId();
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/setup");
  return profile;
}
