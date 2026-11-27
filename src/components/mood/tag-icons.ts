import { Briefcase, CloudSun, Coffee, HeartPulse, House, Moon, Users, type LucideIcon } from "lucide-react";
import type { MoodTag } from "@/lib/mood";

// Kept out of the client chip component so server components (the insights) can use it too.
export const TAG_ICONS: Record<MoodTag, LucideIcon> = {
  Sleep: Moon,
  Work: Briefcase,
  Friends: Users,
  Family: House,
  Health: HeartPulse,
  Weather: CloudSun,
  "Me time": Coffee,
};
