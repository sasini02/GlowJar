"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

const NUDGE_TIMES: Enums<"nudge_time">[] = ["morning", "lunch", "evening", "night"];

export type SetupState = { error: string | null };

export async function suggestUsername(): Promise<string | null> {
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("suggest_username");
  if (error) {
    console.error("suggest_username failed", error.message);
    return null;
  }
  return data;
}

export async function completeSetup(_previous: SetupState, formData: FormData): Promise<SetupState> {
  const userId = await requireUserId();

  const username = String(formData.get("username") ?? "").replace(/\s+/g, " ").trim();
  const nudgeTime = String(formData.get("nudge_time") ?? "") as Enums<"nudge_time">;
  const cheerupsEnabled = formData.get("cheerups_enabled") === "on";
  const timezone = String(formData.get("timezone") ?? "").trim();

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (!NUDGE_TIMES.includes(nudgeTime)) return { error: "Pick a time for your daily nudge." };

  const supabase = await createClient();
  const changes = {
    username,
    nudge_time: nudgeTime,
    cheerups_enabled: cheerupsEnabled,
    onboarded_at: new Date().toISOString(),
    ...(timezone ? { timezone } : {}),
  };

  let { error } = await supabase.from("profiles").update(changes).eq("user_id", userId);

  // An unusual browser timezone name shouldn't block set-up; keep the default and move on.
  if (error?.code === "22023" && timezone) {
    ({ error } = await supabase
      .from("profiles")
      .update({ ...changes, timezone: undefined })
      .eq("user_id", userId));
  }

  if (error) {
    if (error.code === "23505") return { error: "Someone already has that name. Try another, or shuffle." };
    console.error("completeSetup failed", error.code, error.message);
    return { error: "We couldn't save that just now. Please try again." };
  }

  redirect("/feed");
}

function validateUsername(username: string): string | null {
  if (username.length < 3) return "Your name needs at least 3 characters.";
  if (username.length > 32) return "Keep your name to 32 characters or fewer.";
  // Usernames are public, so an "@" is most likely an email being shared by accident.
  if (username.includes("@")) return "Names can't contain @, so your email stays private.";
  return null;
}
