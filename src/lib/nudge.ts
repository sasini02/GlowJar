import type { Enums } from "@/lib/supabase/database.types";

export const NUDGE_OPTIONS: { value: Enums<"nudge_time">; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "Around 8:00" },
  { value: "lunch", label: "Lunch break", hint: "Around 12:30" },
  { value: "evening", label: "After dinner", hint: "Around 19:30" },
  { value: "night", label: "Before bed", hint: "Around 21:30" },
];
