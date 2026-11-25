import type { Enums } from "@/lib/supabase/database.types";

export type CelebrationType = Enums<"celebration_type">;

export const CELEBRATIONS: Record<CelebrationType, { emoji: string; label: string }> = {
  celebrate: { emoji: "🎉", label: "Celebrate" },
  proud: { emoji: "💪", label: "Proud of you" },
  metoo: { emoji: "🤗", label: "Me too" },
};

export const CELEBRATION_ORDER: CelebrationType[] = ["celebrate", "proud", "metoo"];
