"use server";

import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SerializedSubscription } from "@/lib/push/client";

/** Turns weekly cheer-ups on for this browser: saves its push subscription and the preference. */
export async function enableCheerups(subscription: SerializedSubscription): Promise<{ error: string | null }> {
  const userId = await requireUserId();
  if (!subscription.endpoint.startsWith("https://") || !subscription.p256dh || !subscription.auth) {
    return { error: "This browser gave us an unusable push subscription." };
  }

  const supabase = await createClient();
  const { error: subscribeError } = await supabase.rpc("register_push_subscription", {
    sub_endpoint: subscription.endpoint,
    sub_p256dh: subscription.p256dh,
    sub_auth: subscription.auth,
  });
  if (subscribeError) {
    console.error("register_push_subscription failed", subscribeError.code, subscribeError.message);
    return { error: "We couldn't turn on cheer-ups just now. Please try again." };
  }

  const { error } = await supabase.from("profiles").update({ cheerups_enabled: true }).eq("user_id", userId);
  return { error: error ? "We couldn't save that just now. Please try again." : null };
}

/** Turns cheer-ups off everywhere and forgets this browser's subscription. */
export async function disableCheerups(endpoint: string | null): Promise<{ error: string | null }> {
  const userId = await requireUserId();
  const supabase = await createClient();

  if (endpoint) await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  const { error } = await supabase.from("profiles").update({ cheerups_enabled: false }).eq("user_id", userId);
  return { error: error ? "We couldn't save that just now. Please try again." : null };
}
