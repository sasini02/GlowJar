"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { WinComposer, type ComposerValues } from "@/components/wins/win-composer";
import { WIN_IDEAS } from "@/lib/wins/ideas";

type QuickAddProps = {
  username: string;
  defaultPublic: boolean;
};

/** The feed's quick-add bar. Opens the composer in a dialog: a modal on desktop, full screen on phones. */
export function QuickAdd({ username, defaultPublic }: QuickAddProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [initial, setInitial] = useState<ComposerValues | null>(null);
  // Remounts the composer each time it opens, so it never shows a half-written draft from before.
  const [openCount, setOpenCount] = useState(0);

  function open(values: Partial<ComposerValues> = {}) {
    setInitial({ text: "", emoji: null, category: "health", isPublic: defaultPublic, ...values });
    setOpenCount((count) => count + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => open()}
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
            onClick={() => open({ text: idea.text, category: idea.category })}
            className="inline-flex min-h-11 shrink-0 items-center rounded-pill border border-line px-4 text-label text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            {idea.text}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="quick-add-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-ink/40 md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-xl md:rounded-lg md:shadow-lift"
      >
        <div className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="quick-add-title" className="font-serif text-title">
                Add a win
              </h2>
              <p className="mt-1 text-ink-muted">What went right today, however small?</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {initial && (
            <WinComposer key={openCount} username={username} initial={initial} showIdeas={false} autoFocus onCancel={close} />
          )}
        </div>
      </dialog>
    </div>
  );
}
