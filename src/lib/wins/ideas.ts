import type { WinCategory } from "@/lib/categories";

/** Starter ideas for people who aren't sure what counts. Tapping one fills the composer. */
export const WIN_IDEAS: { text: string; category: WinCategory }[] = [
  { text: "Drank a full glass of water", category: "health" },
  { text: "Went outside for five minutes", category: "health" },
  { text: "Finished one small task", category: "work" },
  { text: "Messaged a friend first", category: "social" },
  { text: "Let a worry pass", category: "mind" },
  { text: "Learned one new thing", category: "learning" },
  { text: "Rested without guilt", category: "self_care" },
];

export const EMOJI_CHOICES = ["✨", "🌱", "☀️", "💪", "🎉", "🌙", "📚", "🫶"];
