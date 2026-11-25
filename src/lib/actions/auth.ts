"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site-url";

export type SignInState = { status: "idle" } | { status: "sent" } | { status: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendMagicLink(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "That doesn't look like an email address. Could you check it?" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback`, shouldCreateUser: true },
  });

  if (error) {
    if (error.status === 429) {
      return { status: "error", message: "We've sent a few links already. Please wait a minute and try again." };
    }
    console.error("signInWithOtp failed", error.code, error.message);
    return { status: "error", message: "We couldn't send the link just now. Please try again in a moment." };
  }

  return { status: "sent" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
