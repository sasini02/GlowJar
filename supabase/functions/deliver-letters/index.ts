// Hourly: emails every letter whose delivery date has arrived in its author's
// timezone, then marks it delivered. A letter that fails to send stays
// undelivered and is retried on the next run. (It unlocks in the app on its
// date either way; that rule lives in open_letter().)
import { createClient } from "jsr:@supabase/supabase-js@2";
import { isCronRequest, json } from "../_shared/cron.ts";

type DueLetter = {
  letter_id: string;
  user_id: string;
  email: string;
  username: string;
  body: string;
  deliver_on: string;
  written_on: string;
};

Deno.serve(async (request) => {
  if (!isCronRequest(request)) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("claim_due_letters");
  if (error) {
    console.error("claim_due_letters failed", error);
    return json({ error: error.message }, 500);
  }

  const letters = (data ?? []) as DueLetter[];
  let delivered = 0;

  for (const letter of letters) {
    const ok = await sendEmail(letter);
    if (!ok) continue;

    const { error: updateError } = await supabase
      .from("letters")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", letter.letter_id)
      .is("delivered_at", null);
    if (updateError) console.error("Marking letter delivered failed", letter.letter_id, updateError);
    else delivered += 1;
  }

  return json({ due: letters.length, delivered });
});

async function sendEmail(letter: DueLetter): Promise<boolean> {
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  const link = `${siteUrl}/letters/${letter.letter_id}`;
  const writtenOn = formatDate(letter.written_on);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL"),
      to: letter.email,
      subject: `A letter from you, written on ${writtenOn}`,
      text: `On ${writtenOn} you wrote this letter to yourself.\n\n${letter.body}\n\nRead it in Glowjar: ${link}`,
      html: letterHtml(letter.body, writtenOn, link),
    }),
  });

  if (!response.ok) {
    console.error("Resend failed", letter.letter_id, response.status, await response.text());
    return false;
  }
  return true;
}

function letterHtml(body: string, writtenOn: string, link: string) {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!doctype html>
<html><body style="margin:0;background:#34406B;padding:32px 16px;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:560px;margin:0 auto;background:#FBF7F0;border-radius:22px;padding:36px 32px;color:#2A2D3A">
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;color:#646877">On ${escapeHtml(writtenOn)} you wrote this letter to yourself.</p>
    <div style="font-size:18px;line-height:28px">${paragraphs}</div>
    <p style="margin:28px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#F2B544;color:#2A2D3A;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;padding:12px 20px;border-radius:16px">Open it in Glowjar</a></p>
  </div>
</body></html>`;
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}
