"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

const NUDGE_TIMES: Enums<"nudge_time">[] = ["morning", "lunch", "evening", "night"];
const THEMES: Enums<"theme_preference">[] = ["day", "night", "auto"];
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

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
  const timezone = String(formData.get("timezone") ?? "").trim();

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (!NUDGE_TIMES.includes(nudgeTime)) return { error: "Pick a time for your daily nudge." };

  const supabase = await createClient();
  const changes = {
    username,
    nudge_time: nudgeTime,
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

  redirect("/home");
}

export type SettingsState = { status: "idle" | "saved" | "error"; message: string | null };

export type UsernameState = SettingsState & { username?: string };

/** Saves just the public name, from its own Save button on the settings page. */
export async function updateUsername(_previous: UsernameState, formData: FormData): Promise<UsernameState> {
  const userId = await requireUserId();
  const username = String(formData.get("username") ?? "").replace(/\s+/g, " ").trim();

  const usernameError = validateUsername(username);
  if (usernameError) return { status: "error", message: usernameError };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ username }).eq("user_id", userId);
  if (error) {
    if (error.code === "23505") return { status: "error", message: "Someone already has that name. Try another, or shuffle." };
    console.error("updateUsername failed", error.code, error.message);
    return { status: "error", message: "We couldn't save that just now. Please try again." };
  }

  refresh();
  return { status: "saved", message: `Saved. You're ${username} now.`, username };
}

export async function updateSettings(_previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const userId = await requireUserId();

  const nudgeTime = String(formData.get("nudge_time") ?? "") as Enums<"nudge_time">;
  const quietStart = String(formData.get("quiet_start") ?? "");
  const quietEnd = String(formData.get("quiet_end") ?? "");
  const visibility = String(formData.get("default_visibility") ?? "") as Enums<"visibility">;
  const glowReminders = formData.get("glow_reminders") === "on";

  if (!NUDGE_TIMES.includes(nudgeTime)) return { status: "error", message: "Pick a time for your daily nudge." };
  if (!TIME_OF_DAY.test(quietStart) || !TIME_OF_DAY.test(quietEnd)) {
    return { status: "error", message: "Quiet hours need a start and an end time." };
  }
  if (visibility !== "public" && visibility !== "private") {
    return { status: "error", message: "Choose Public or Just me for new wins." };
  }

  const supabase = await createClient();
  // Changing quiet hours re-books the next cheer-up through the profiles trigger.
  const { error } = await supabase
    .from("profiles")
    .update({
      nudge_time: nudgeTime,
      glow_reminders_enabled: glowReminders,
      quiet_start: quietStart,
      quiet_end: quietEnd,
      default_visibility: visibility,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("updateSettings failed", error.code, error.message);
    return { status: "error", message: "We couldn't save that just now. Please try again." };
  }

  refresh();
  return { status: "saved", message: "Saved your preferences." };
}

export async function updateTheme(theme: Enums<"theme_preference">): Promise<{ error: string | null }> {
  const userId = await requireUserId();
  if (!THEMES.includes(theme)) return { error: "Pick Day, Night or Auto." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ theme }).eq("user_id", userId);
  if (error) {
    console.error("updateTheme failed", error.code, error.message);
    return { error: "We couldn't save your theme. It will still apply on this device." };
  }
  return { error: null };
}

function validateUsername(username: string): string | null {
  if (username.length < 3) return "Your name needs at least 3 characters.";
  if (username.length > 32) return "Keep your name to 32 characters or fewer.";
  // Usernames are public, so an "@" is most likely an email being shared by accident.
  if (username.includes("@")) return "Names can't contain @, so your email stays private.";
  return null;
}

/**
 * Keeps the profile's timezone in step with the device the person is using.
 * Their "today" (greeting, streak, mood, reminders) follows it, so a wrong one
 * makes the whole app feel off by hours.
 */
export async function syncTimezone(timezone: string): Promise<void> {
  const userId = await requireUserId();
  const name = timezone.trim();
  if (!name || name.length > 64) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ timezone: name })
    .eq("user_id", userId)
    .neq("timezone", name)
    .select("user_id");

  // 22023: a name Postgres doesn't know (the profiles trigger checks). Keep the current one.
  if (error) {
    if (error.code !== "22023") console.error("syncTimezone failed", error.code, error.message);
    return;
  }
  if (data.length > 0) refresh();
}
