// Hourly: one gentle reminder for people whose daily nudge time has just passed
// and who haven't added a win today. Who is due (and the quiet-hours and
// once-a-day rules) is decided by claim_due_glow_reminders(); this only delivers.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { isCronRequest, json } from "../_shared/cron.ts";

type Subscription = { endpoint: string; p256dh: string; auth: string };
type DueReminder = { user_id: string; subscriptions: Subscription[] | null };

const PAYLOAD = JSON.stringify({
  title: "Glowjar",
  body: "Your jar is waiting for today's light ✨",
  url: "/home",
  tag: "glowjar-daily",
});

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (request) => {
  if (!isCronRequest(request)) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("claim_due_glow_reminders");
  if (error) {
    console.error("claim_due_glow_reminders failed", error);
    return json({ error: error.message }, 500);
  }

  const due = (data ?? []) as DueReminder[];
  const expired: string[] = [];
  let sent = 0;

  for (const reminder of due) {
    for (const subscription of reminder.subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          PAYLOAD,
          // A reminder that arrives hours late would land at night, so let it expire instead.
          { TTL: 60 * 60 * 2, urgency: "low" },
        );
        sent += 1;
      } catch (pushError) {
        const status = (pushError as { statusCode?: number }).statusCode;
        // 404/410 mean the browser has dropped this subscription for good.
        if (status === 404 || status === 410) expired.push(subscription.endpoint);
        else console.error("Push failed", status, (pushError as Error).message);
      }
    }
  }

  if (expired.length) {
    const { error: removeError } = await supabase.rpc("remove_push_subscriptions", { endpoints: expired });
    if (removeError) console.error("Removing expired subscriptions failed", removeError);
  }

  return json({ users: due.length, sent });
});
