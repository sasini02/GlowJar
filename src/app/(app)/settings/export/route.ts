import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { localToday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

// Everything a person has written, as JSON. Letters whose date hasn't arrived are
// listed without their body: open_letter() refuses them, and the export follows
// the same rule as the app.
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = await createClient();
  const [
    { data: profileRow },
    { data: wins, error: winsError },
    { data: letters, error: lettersError },
    { data: moods, error: moodsError },
  ] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, timezone, nudge_time, cheerups_enabled, quiet_start, quiet_end, theme, default_visibility, created_at")
        .eq("user_id", profile.user_id)
        .single(),
      supabase
        .from("wins")
        .select("id, text, emoji, category, is_public, created_at, updated_at, celebrations(type)")
        .eq("user_id", profile.user_id)
        .order("created_at"),
      supabase
        .from("letters")
        .select("id, deliver_on, delivered_at, created_at")
        .eq("user_id", profile.user_id)
        .order("created_at"),
      supabase
        .from("moods")
        .select("local_date, level, tags, note, created_at, updated_at")
        .eq("user_id", profile.user_id)
        .order("local_date"),
    ]);

  if (winsError || lettersError || moodsError) {
    console.error("export failed", winsError?.message, lettersError?.message, moodsError?.message);
    return NextResponse.json({ error: "We couldn't prepare your data just now." }, { status: 500 });
  }

  const today = localToday(profile.timezone);
  const exportedLetters = await Promise.all(
    letters.map(async (letter) => {
      const open = letter.deliver_on <= today;
      const body = open ? (await supabase.rpc("open_letter", { letter_id: letter.id })).data : null;
      return {
        id: letter.id,
        written_at: letter.created_at,
        deliver_on: letter.deliver_on,
        delivered_at: letter.delivered_at,
        body,
        sealed: !open,
      };
    }),
  );

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profileRow,
    wins: wins.map(({ celebrations, is_public, ...win }) => ({
      ...win,
      visibility: is_public ? "public" : "just_me",
      celebrations: {
        celebrate: celebrations.filter((c) => c.type === "celebrate").length,
        proud: celebrations.filter((c) => c.type === "proud").length,
        metoo: celebrations.filter((c) => c.type === "metoo").length,
      },
    })),
    letters: exportedLetters,
    moods,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="glowjar-export-${today}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
