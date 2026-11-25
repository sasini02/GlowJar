import type { ReactNode } from "react";
import { CATEGORIES, type WinCategory } from "@/lib/categories";

type WinTileProps = {
  text: string;
  emoji: string | null;
  category: WinCategory;
  /** Controls pinned to the tile's top-right corner, like Pinterest's Save button. */
  actions?: ReactNode;
  className?: string;
};

/** The tinted tile a win sits on. Presentational only, so it renders on the server too. */
export function WinTile({ text, emoji, category, actions, className = "" }: WinTileProps) {
  return (
    <div className={`relative rounded-lg p-7 shadow-card ${CATEGORIES[category].tint} ${className}`}>
      {emoji && <p className="mb-3 text-win-emoji">{emoji}</p>}
      <p className="font-serif text-win-text break-words whitespace-pre-line text-ink">{text}</p>
      {actions && <div className="absolute top-3 right-3 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type AuthorLineProps = {
  username: string;
  category: WinCategory;
  children?: ReactNode;
};

/** The quiet line under a tile: initial, username, category. */
export function AuthorLine({ username, category, children }: AuthorLineProps) {
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2 px-1 text-label">
      <span
        aria-hidden="true"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-pill bg-dusk text-caption text-on-dusk"
      >
        {username.charAt(0).toUpperCase()}
      </span>
      <span className="truncate font-semibold text-ink">{username}</span>
      <span className="shrink-0 text-ink-muted">{CATEGORIES[category].label}</span>
      {children}
    </div>
  );
}
