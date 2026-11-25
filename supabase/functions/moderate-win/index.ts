// Checks a win's text before it is shared publicly. Called by the app's
// createWin/updateWin Server Actions with the signed-in user's access token.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { moderateText } from "../_shared/moderation.ts";

const MAX_LENGTH = 280;

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // verify_jwt is off for this function (it doesn't work with the new JWT signing keys),
  // so confirm here that the caller is a signed-in user.
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims.sub) return json({ error: "Unauthorized" }, 401);

  let text = "";
  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    return json({ error: "Expected a JSON body with a text field" }, 400);
  }
  if (!text.trim() || Array.from(text).length > MAX_LENGTH) {
    return json({ error: `Text must be between 1 and ${MAX_LENGTH} characters` }, 400);
  }

  return json(moderateText(text));
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
