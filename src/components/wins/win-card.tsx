"use client";

import { useState, type MouseEvent } from "react";
import { Lock } from "lucide-react";
import { CELEBRATION_ORDER, CELEBRATIONS } from "@/lib/celebrations";
import type { WinView } from "@/lib/wins/queries";
import { AuthorLine, WinTile } from "./win-tile";
import { CelebrateControl } from "./celebrate-control";
import { OwnWinMenu } from "./own-win-menu";
import { ReportMenu } from "./report-menu";

// Hover on desktop, keyboard focus, or a tap on touch screens (data-revealed) shows the controls.
const HIDDEN_UNTIL_REVEALED =
  "opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[revealed]:opacity-100";

type WinCardProps = {
  win: WinView;
  /** Where the edit screen sends the author back to. */
  returnTo: string;
  className?: string;
};

export function WinCard({ win, returnTo, className = "" }: WinCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [reported, setReported] = useState(false);

  function toggleReveal(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) return;
    setRevealed((value) => !value);
  }

  if (reported) {
    return (
      <p role="status" className={`break-inside-avoid rounded-lg border border-line p-5 text-label text-ink-muted ${className}`}>
        Thanks for letting us know. We&apos;ve hidden this win for you and a moderator will take a look.
      </p>
    );
  }

  const actions = win.isOwn ? (
    <OwnWinMenu winId={win.id} returnTo={returnTo} hiddenUntilRevealed={HIDDEN_UNTIL_REVEALED} />
  ) : win.isPublic ? (
    <>
      <CelebrateControl winId={win.id} initial={win.myCelebration} hiddenUntilRevealed={HIDDEN_UNTIL_REVEALED} />
      <ReportMenu winId={win.id} hiddenUntilRevealed={HIDDEN_UNTIL_REVEALED} onReported={() => setReported(true)} />
    </>
  ) : null;

  return (
    <article className={`group break-inside-avoid ${className}`} data-revealed={revealed || undefined}>
      <div onClick={toggleReveal}>
        <WinTile text={win.text} emoji={win.emoji} category={win.category} actions={actions} />
      </div>
      <AuthorLine username={win.username} category={win.category}>
        {win.isOwn && !win.isPublic && (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-caption text-sage-ink">
            <Lock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            Just me
          </span>
        )}
        {win.counts && <OwnCounts counts={win.counts} />}
      </AuthorLine>
    </article>
  );
}

/** Reaction counts, shown only on the author's own cards. */
function OwnCounts({ counts }: { counts: NonNullable<WinView["counts"]> }) {
  const shown = CELEBRATION_ORDER.filter((type) => counts[type] > 0);
  if (!shown.length) return null;

  const description = shown.map((type) => `${counts[type]} ${CELEBRATIONS[type].label}`).join(", ");
  return (
    <span className="ml-auto flex shrink-0 gap-2 text-caption text-ink-muted" title="Only you can see this">
      <span className="sr-only">Celebrations only you can see: {description}</span>
      {shown.map((type) => (
        <span key={type} aria-hidden="true">
          {CELEBRATIONS[type].emoji} {counts[type]}
        </span>
      ))}
    </span>
  );
}
