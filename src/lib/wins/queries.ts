import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WinCategory } from "@/lib/categories";
import type { Enums } from "@/lib/supabase/database.types";

type CelebrationType = Enums<"celebration_type">;

export type CelebrationCounts = Record<CelebrationType, number>;

export type WinView = {
  id: string;
  text: string;
  emoji: string | null;
  category: WinCategory;
  isPublic: boolean;
  createdAt: string;
  username: string;
  isOwn: boolean;
  /** The viewer's own reaction, if any. */
  myCelebration: CelebrationType | null;
  /** Only filled in for the viewer's own wins: nobody else sees counts. */
  counts: CelebrationCounts | null;
};

const FEED_LIMIT = 60;

const WIN_COLUMNS = "id, user_id, text, emoji, category, is_public, created_at, author:public_profiles!wins_user_id_fkey(username)";

type WinRow = {
  id: string;
  user_id: string;
  text: string;
  emoji: string | null;
  category: WinCategory;
  is_public: boolean;
  created_at: string;
  author: { username: string | null } | null;
};

/** Public wins, newest first. The feed deliberately stops instead of scrolling forever. */
export async function getFeedWins(viewerId: string, category: WinCategory | null): Promise<WinView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("wins")
    .select(WIN_COLUMNS)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return withCelebrations(data, viewerId);
}

/** All of the viewer's wins, public and private. */
export async function getMyWins(viewerId: string): Promise<WinView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wins")
    .select(WIN_COLUMNS)
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withCelebrations(data, viewerId);
}

export async function getOwnWin(viewerId: string, id: string): Promise<WinView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wins")
    .select(WIN_COLUMNS)
    .eq("id", id)
    .eq("user_id", viewerId)
    .maybeSingle();
  if (error || !data) return null;
  const [win] = await withCelebrations([data], viewerId);
  return win;
}

/** A few recent public wins from other people that the viewer hasn't celebrated yet. */
export async function getWinsToCheer(viewerId: string, count = 3): Promise<WinView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wins")
    .select(WIN_COLUMNS)
    .eq("is_public", true)
    .neq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const wins = await withCelebrations(data, viewerId);
  return wins.filter((win) => !win.myCelebration).slice(0, count);
}

/** How many wins the viewer has added this calendar month, in their own timezone. */
export async function countWinsThisMonth(viewerId: string, timezone: string): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("wins")
    .select("created_at")
    .eq("user_id", viewerId)
    .gte("created_at", since);
  if (error) throw error;

  const now = new Date();
  const thisMonth = monthKey(now, timezone);
  return data.filter((row) => monthKey(new Date(row.created_at), timezone) === thisMonth).length;
}

function monthKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit" }).format(date);
}

async function withCelebrations(rows: WinRow[], viewerId: string): Promise<WinView[]> {
  if (!rows.length) return [];

  const supabase = await createClient();
  // RLS returns the viewer's own reactions plus every reaction on the viewer's wins, nothing else.
  const { data: celebrations, error } = await supabase
    .from("celebrations")
    .select("win_id, user_id, type")
    .in(
      "win_id",
      rows.map((row) => row.id),
    );
  if (error) throw error;

  return rows.map((row) => {
    const isOwn = row.user_id === viewerId;
    const onThisWin = celebrations.filter((c) => c.win_id === row.id);
    const mine = onThisWin.find((c) => c.user_id === viewerId);

    let counts: CelebrationCounts | null = null;
    if (isOwn) {
      counts = { celebrate: 0, proud: 0, metoo: 0 };
      for (const c of onThisWin) counts[c.type] += 1;
    }

    return {
      id: row.id,
      text: row.text,
      emoji: row.emoji,
      category: row.category,
      isPublic: row.is_public,
      createdAt: row.created_at,
      username: row.author?.username ?? "Someone",
      isOwn,
      myCelebration: mine?.type ?? null,
      counts,
    };
  });
}
