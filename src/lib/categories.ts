import type { Enums } from "@/lib/supabase/database.types";

export type WinCategory = Enums<"win_category">;

type CategoryStyle = {
  label: string;
  /** Tailwind background class for the win card tint. */
  tint: string;
};

// Each category owns one card tint from design/tokens.json.
export const CATEGORIES: Record<WinCategory, CategoryStyle> = {
  health: { label: "Health", tint: "bg-card-mint" },
  work: { label: "Work", tint: "bg-card-butter" },
  social: { label: "Social", tint: "bg-card-peach" },
  mind: { label: "Mind", tint: "bg-card-sky" },
  learning: { label: "Learning", tint: "bg-card-lilac" },
  self_care: { label: "Self-care", tint: "bg-card-blush" },
};

export const CATEGORY_ORDER: WinCategory[] = ["health", "work", "social", "mind", "learning", "self_care"];
