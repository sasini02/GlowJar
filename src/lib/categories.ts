import type { Enums } from "@/lib/supabase/database.types";

export type WinCategory = Enums<"win_category">;

type CategoryStyle = {
  label: string;
  /** The fuller name used on Home's "What lit your jar". */
  longLabel: string;
  /** Tailwind background class for the win card tint. */
  tint: string;
  /** The same tint as a CSS variable, for drawing outside Tailwind (the recap image). */
  cssVar: string;
};

// Each category owns one card tint from design/tokens.json.
export const CATEGORIES: Record<WinCategory, CategoryStyle> = {
  health: { label: "Health", longLabel: "Health and body", tint: "bg-card-mint", cssVar: "--card-mint" },
  work: { label: "Work", longLabel: "Work and study", tint: "bg-card-butter", cssVar: "--card-butter" },
  social: { label: "Social", longLabel: "Social", tint: "bg-card-peach", cssVar: "--card-peach" },
  mind: { label: "Mind", longLabel: "Mind and calm", tint: "bg-card-sky", cssVar: "--card-sky" },
  learning: { label: "Learning", longLabel: "Learning and creative", tint: "bg-card-lilac", cssVar: "--card-lilac" },
  self_care: { label: "Self-care", longLabel: "Self-care", tint: "bg-card-blush", cssVar: "--card-blush" },
};

export const CATEGORY_ORDER: WinCategory[] = ["health", "work", "social", "mind", "learning", "self_care"];

// Words that point to a category, for composers that don't ask (Home's inline composer).
// Checked in this order; the first category with a match wins.
const CATEGORY_HINTS: [WinCategory, RegExp][] = [
  ["health", /\b(walk(ed)?|run|ran|gym|water|sleep|slept|ate|meal|vegetables?|doctor|dentist|stretch(ed)?|exercise|swim|yoga|steps|medicine)\b/i],
  ["work", /\b(work|job|boss|meeting|email|report|deadline|project|assignment|exam|study|studied|homework|client|task|shift|interview)\b/i],
  ["social", /\b(friend|friends|sister|brother|mum|mom|dad|family|partner|neighbou?r|called|texted|messaged|met|hug|date|party|colleague)\b/i],
  ["learning", /\b(learn(ed|t)?|read|book|pages|course|practi[cs]ed|piano|guitar|language|drew|draw|paint(ed)?|wrote|writing|code|coded)\b/i],
  ["self_care", /\b(rest(ed)?|nap|bath|shower|treat|self-care|tidied|cleaned|journal(ed)?|said no|boundar(y|ies)|break)\b/i],
  ["mind", /\b(worry|anxious|anxiety|calm|breathe|breathed|meditat(e|ed|ion)|therapy|patient|brave|stress|feelings?)\b/i],
];

/** A best guess at a win's category from its words. Falls back to Mind, the broadest one. */
export function guessCategory(text: string): WinCategory {
  return CATEGORY_HINTS.find(([, pattern]) => pattern.test(text))?.[0] ?? "mind";
}
