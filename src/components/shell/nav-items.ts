import { CircleUserRound, LayoutGrid, Mail, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { JarMark } from "@/components/brand/jar-mark";

export const ICON_STROKE = 1.75;

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
};

export const feedItem: NavItem = { href: "/feed", label: "Feed", icon: LayoutGrid };
export const jarItem: NavItem = { href: "/jar", label: "My jar", icon: JarMark };
export const lettersItem: NavItem = { href: "/letters", label: "Letters", icon: Mail };
export const youItem: NavItem = { href: "/settings", label: "You", icon: CircleUserRound };

export const desktopNav = [feedItem, jarItem, lettersItem];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
