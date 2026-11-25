import type { Enums } from "@/lib/supabase/database.types";

export type ThemePreference = Enums<"theme_preference">;

export const THEME_STORAGE_KEY = "glowjar-theme";

// Runs in <head> before the first paint, so a Night choice never flashes the Day colours.
// It only reads localStorage: the saved profile value reaches it through ThemeSync.
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="day"||t==="night")document.documentElement.dataset.theme=t}catch(e){}`;

/** Day and Night set data-theme; Auto removes it so the tokens follow the system setting. */
export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === "auto") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Without storage the theme still applies for this page view.
  }
}
