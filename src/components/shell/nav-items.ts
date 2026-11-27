import { House, LayoutGrid, Mail, Moon, Smile, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { JarMark } from "@/components/brand/jar-mark";

export const ICON_STROKE = 1.75;

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  /** The tint behind the icon when the tab is active. */
  activeTint: string;
};

export const homeItem: NavItem = { href: "/home", label: "Home", icon: House, activeTint: "bg-card-butter" };
export const feedItem: NavItem = { href: "/feed", label: "Feed", icon: LayoutGrid, activeTint: "bg-card-peach" };
export const moodItem: NavItem = { href: "/mood", label: "Mood", icon: Smile, activeTint: "bg-card-sky" };
export const jarItem: NavItem = { href: "/jar", label: "My jar", icon: JarMark, activeTint: "bg-card-lilac" };
export const lettersItem: NavItem = { href: "/letters", label: "Letters", icon: Mail, activeTint: "bg-card-blush" };
export const hardDayItem: NavItem = { href: "/hard-day", label: "Hard day", icon: Moon, activeTint: "bg-card-sky" };

export const sidebarNav: NavItem[] = [
  homeItem,
  feedItem,
  { ...moodItem, label: "Mood board" },
  jarItem,
  lettersItem,
  hardDayItem,
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
