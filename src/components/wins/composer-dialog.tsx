"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { X } from "lucide-react";
import { WinComposer, type ComposerValues } from "./win-composer";

export type ComposerDialogHandle = { open: (values?: Partial<ComposerValues>) => void };

type ComposerDialogProps = {
  ref: Ref<ComposerDialogHandle>;
  username: string;
  defaultPublic: boolean;
  /** Keep the writer on this page after saving, then call `onSaved`. */
  stayOnSave?: boolean;
  onSaved?: () => void;
};

/** The win composer in a dialog: a modal on desktop, full screen on phones. */
export function ComposerDialog({ ref, username, defaultPublic, stayOnSave = false, onSaved }: ComposerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [initial, setInitial] = useState<ComposerValues | null>(null);
  // Remounts the composer each time it opens, so it never shows a half-written draft from before.
  const [openCount, setOpenCount] = useState(0);

  useImperativeHandle(ref, () => ({
    open(values = {}) {
      setInitial({ text: "", emoji: null, category: "health", isPublic: defaultPublic, ...values });
      setOpenCount((count) => count + 1);
      dialogRef.current?.showModal();
    },
  }));

  function close() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="composer-dialog-title"
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-ink/40 md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-xl md:rounded-lg md:shadow-lift"
    >
      <div className="p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="composer-dialog-title" className="font-serif text-title">
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
          <WinComposer
            key={openCount}
            username={username}
            initial={initial}
            showIdeas={false}
            autoFocus
            onCancel={close}
            stayOnSave={stayOnSave}
            onSaved={() => {
              close();
              onSaved?.();
            }}
          />
        )}
      </div>
    </dialog>
  );
}
