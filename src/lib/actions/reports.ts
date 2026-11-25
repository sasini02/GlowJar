"use server";

import { refresh } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export async function reportWin(winId: string, reason: string): Promise<{ error: string | null }> {
  const userId = await requireUserId();
  if (!REPORT_REASONS.includes(reason)) return { error: "Pick a reason." };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({ win_id: winId, reporter_id: userId, reason });

  // Reporting the same win twice is fine from the reporter's point of view.
  if (error && error.code !== "23505") {
    console.error("reportWin failed", error.code, error.message);
    return { error: "We couldn't send that report just now. Please try again." };
  }
  return { error: null };
}

export async function resolveReports(winId: string, decision: Enums<"report_status">): Promise<{ error: string | null }> {
  await requireUserId();
  if (decision !== "reviewed" && decision !== "removed") return { error: "Unknown decision." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_reports", { target_win: winId, decision });
  if (error) {
    console.error("resolve_reports failed", error.code, error.message);
    return { error: error.code === "42501" ? "Only moderators can do that." : "That didn't save. Please try again." };
  }

  refresh();
  return { error: null };
}
