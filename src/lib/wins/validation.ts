import { CATEGORY_ORDER, type WinCategory } from "@/lib/categories";

export const MAX_WIN_LENGTH = 280;

/** Counts characters the way Postgres char_length does (code points), so an emoji isn't counted twice. */
export function charCount(text: string): number {
  return Array.from(text).length;
}

export type WinInput = {
  text: string;
  emoji: string | null;
  category: WinCategory;
  isPublic: boolean;
};

const SINGLE_EMOJI = /^\p{Extended_Pictographic}(\p{Emoji_Modifier}|\u{FE0F}|\u{200D}\p{Extended_Pictographic})*$/u;

export function parseWinInput(formData: FormData): { data: WinInput } | { error: string } {
  const text = String(formData.get("text") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "") as WinCategory;
  const visibility = String(formData.get("visibility") ?? "");

  if (!text) return { error: "Write a few words about your win first." };
  if (charCount(text) > MAX_WIN_LENGTH) return { error: `Keep it to ${MAX_WIN_LENGTH} characters.` };
  if (emoji && !SINGLE_EMOJI.test(emoji)) return { error: "Pick one emoji, or none." };
  if (!CATEGORY_ORDER.includes(category)) return { error: "Pick a category for this win." };
  if (visibility !== "public" && visibility !== "private") return { error: "Choose Public or Just me." };

  return { data: { text, emoji, category, isPublic: visibility === "public" } };
}
