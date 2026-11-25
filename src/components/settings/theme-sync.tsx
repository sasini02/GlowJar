"use client";

import { useEffect } from "react";
import { applyTheme, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

/** Brings this device in line with the theme saved on the profile, e.g. after signing in on a new phone. */
export function ThemeSync({ theme }: { theme: ThemePreference }) {
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Fall through and apply the profile's theme.
    }
    if (stored !== theme) applyTheme(theme);
  }, [theme]);

  return null;
}
