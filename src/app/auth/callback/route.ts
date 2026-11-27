import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both magic-link styles: the default email template sends a PKCE `code`,
// and a customised template can send `token_hash` + `type`, which also works when
// the link is opened in a different browser from the one that asked for it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let signedIn = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    signedIn = !error;
  }

  if (!signedIn) {
    return NextResponse.redirect(`${origin}/?error=link`);
  }

  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", claims?.claims.sub ?? "")
    .maybeSingle();

  return NextResponse.redirect(`${origin}${profile?.onboarded_at ? "/home" : "/setup"}`);
}
