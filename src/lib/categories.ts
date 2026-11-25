import type { Enums } from "@/lib/supabase/database.types";

export type WinCategory = Enums<"win_category">;

type CategoryStyle = {
  label: string;
  /** Tailwind background class for the win card tint. */
  tint: string;
  /** The same tint as a CSS variable, for drawing outside Tailwind (the recap image). */
  cssVar: string;
};

// Each category owns one card tint from design/tokens.json.
export const CATEGORIES: Record<WinCategory, CategoryStyle> = {
  health: { label: "Health", tint: "bg-card-mint", cssVar: "--card-mint" },
  work: { label: "Work", tint: "bg-card-butter", cssVar: "--card-butter" },
  social: { label: "Social", tint: "bg-card-peach", cssVar: "--card-peach" },
  mind: { label: "Mind", tint: "bg-card-sky", cssVar: "--card-sky" },
  learning: { label: "Learning", tint: "bg-card-lilac", cssVar: "--card-lilac" },
  self_care: { label: "Self-care", tint: "bg-card-blush", cssVar: "--card-blush" },
};

export const CATEGORY_ORDER: WinCategory[] = ["health", "work", "social", "mind", "learning", "self_care"];
