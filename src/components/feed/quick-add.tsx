"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { ComposerDialog, type ComposerDialogHandle } from "@/components/wins/composer-dialog";
import { WIN_IDEAS } from "@/lib/wins/ideas";

type QuickAddProps = {
  username: string;
  defaultPublic: boolean;
};

/** The feed's quick-add bar. Opens the composer in a dialog. */
export function QuickAdd({ username, defaultPublic }: QuickAddProps) {
  const dialogRef = useRef<ComposerDialogHandle>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => dialogRef.current?.open()}
        className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line bg-surface-raised px-5 text-left text-ink-muted shadow-card transition-shadow duration-200 hover:shadow-lift"
      >
        <Plus className="size-5 text-ink" strokeWidth={1.75} aria-hidden="true" />
        What went right today, however small?
      </button>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {WIN_IDEAS.slice(0, 5).map((idea) => (
          <button
            key={idea.text}
            type="button"
            onClick={() => dialogRef.current?.open({ text: idea.text, category: idea.category })}
            className="inline-flex min-h-11 shrink-0 items-center rounded-pill border border-line px-4 text-label text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            {idea.text}
          </button>
        ))}
      </div>

      <ComposerDialog ref={dialogRef} username={username} defaultPublic={defaultPublic} />
    </div>
  );
}
