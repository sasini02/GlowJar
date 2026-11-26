// Hourly: sends each user whose weekly slot has arrived one of their own past
// wins by Web Push. Picking the win (and the 6-month rule) happens in the
// claim_due_cheerups() database function; this only delivers.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { isCronRequest, json } from "../_shared/cron.ts";

type Subscription = { endpoint: string; p256dh: string; auth: string };

type DueCheerup = {
  user_id: string;
  kind: "win" | "nudge";
  win_id: string | null;
  win_text: string | null;
  win_emoji: string | null;
  subscriptions: Subscription[];
};

const KIND_LINES = [
  "You were braver than you felt.",
  "Look how far you've come.",
  "This was you. It still is.",
  "Small things add up. This one did.",
  "Remember this one?",
];

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

  const { data, error } = await supabase.rpc("claim_due_cheerups");
  if (error) {
    console.error("claim_due_cheerups failed", error);
    return json({ error: error.message }, 500);
  }

  const due = (data ?? []) as DueCheerup[];
  const expired: string[] = [];
  let sent = 0;

  for (const cheerup of due) {
    const payload = JSON.stringify(buildPayload(cheerup));

    for (const subscription of cheerup.subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: 60 * 60 * 24, urgency: "low" },
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

  let removedSubscriptions = 0;
  if (expired.length) {
    const { data: removed, error: removeError } = await supabase.rpc("remove_push_subscriptions", { endpoints: expired });
    if (removeError) console.error("Removing expired subscriptions failed", removeError);
    else removedSubscriptions = removed ?? 0;
  }

  return json({ users: due.length, sent, removedSubscriptions });
});

function buildPayload(cheerup: DueCheerup) {
  if (cheerup.kind === "nudge" || !cheerup.win_id) {
    return {
      title: "Your jar is waiting",
      body: "Anything small go right lately? It counts. Add your first light.",
      url: "/new",
      tag: "glowjar-nudge",
    };
  }

  const line = KIND_LINES[Math.floor(Math.random() * KIND_LINES.length)];
  const text = truncate(cheerup.win_text ?? "", 110);
  return {
    title: "A little light from your jar",
    body: `${cheerup.win_emoji ? `${cheerup.win_emoji} ` : ""}"${text}" ${line}`,
    url: `/cheer-up/${cheerup.win_id}`,
    tag: "glowjar-cheerup",
  };
}

function truncate(text: string, max: number) {
  const characters = Array.from(text);
  return characters.length <= max ? text : `${characters.slice(0, max - 1).join("").trimEnd()}…`;
}
