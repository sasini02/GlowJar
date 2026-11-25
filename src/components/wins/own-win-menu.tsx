"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { deleteWin } from "@/lib/actions/wins";
import { useDismiss } from "@/components/ui/use-dismiss";

type OwnWinMenuProps = {
  winId: string;
  returnTo: string;
  hiddenUntilRevealed: string;
};

export function OwnWinMenu({ winId, returnTo, hiddenUntilRevealed }: OwnWinMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setConfirming(false);
  }, []);
  useDismiss(containerRef, open, close);

  function confirmDelete() {
    setError(null);
    startDelete(async () => {
      const result = await deleteWin(winId);
      if (result.error) setError(result.error);
      else close();
    });
  }

  return (
    <div ref={containerRef} className={`relative ${open ? "" : hiddenUntilRevealed}`}>
      <button
        type="button"
        aria-label="Options for this win"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex size-11 items-center justify-center rounded-pill bg-surface-raised text-ink shadow-card transition-colors duration-200 hover:bg-surface"
      >
        <Ellipsis className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-20 mt-2 w-52 rounded-md bg-surface-raised p-1.5 shadow-lift">
          {confirming ? (
            <div className="p-2">
              <p className="text-label text-ink">Delete this light?</p>
              <p className="mt-1 text-caption text-ink-muted">It will be gone from your jar for good.</p>
              {error && (
                <p role="alert" className="mt-2 text-caption text-danger">
                  {error}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm bg-danger px-3 text-label text-surface disabled:opacity-70"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm border border-line px-3 text-label text-ink"
                >
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                role="menuitem"
                href={`/wins/${winId}/edit?returnTo=${encodeURIComponent(returnTo)}`}
                className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-label text-ink transition-colors duration-200 hover:bg-surface"
              >
                <Pencil className="size-4" strokeWidth={1.75} aria-hidden="true" />
                Edit
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-label text-danger transition-colors duration-200 hover:bg-surface"
              >
                <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
