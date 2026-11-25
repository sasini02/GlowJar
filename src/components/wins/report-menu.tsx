"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Ellipsis, Flag } from "lucide-react";
import { reportWin } from "@/lib/actions/reports";
import { REPORT_REASONS } from "@/lib/reports";
import { useDismiss } from "@/components/ui/use-dismiss";

type ReportMenuProps = {
  winId: string;
  hiddenUntilRevealed: string;
  onReported: () => void;
};

export function ReportMenu({ winId, hiddenUntilRevealed, onReported }: ReportMenuProps) {
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setChoosing(false);
  }, []);
  useDismiss(containerRef, open, close);

  function send(reason: string) {
    setError(null);
    startSending(async () => {
      const result = await reportWin(winId, reason);
      if (result.error) return setError(result.error);
      close();
      onReported();
    });
  }

  return (
    <div ref={containerRef} className={`relative ${open ? "" : hiddenUntilRevealed}`}>
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex size-11 items-center justify-center rounded-pill bg-surface-raised text-ink shadow-card transition-colors duration-200 hover:bg-surface"
      >
        <Ellipsis className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-20 mt-2 w-64 rounded-md bg-surface-raised p-1.5 shadow-lift">
          {choosing ? (
            <>
              <p className="px-3 pt-2 pb-1 text-label text-ink">What&apos;s wrong with it?</p>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  role="menuitem"
                  disabled={sending}
                  onClick={() => send(reason)}
                  className="flex min-h-11 w-full items-center rounded-sm px-3 text-left text-label text-ink transition-colors duration-200 hover:bg-surface disabled:opacity-60"
                >
                  {reason}
                </button>
              ))}
              {error && (
                <p role="alert" className="px-3 py-2 text-caption text-danger">
                  {error}
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => setChoosing(true)}
              className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-label text-ink transition-colors duration-200 hover:bg-surface"
            >
              <Flag className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Report this win
            </button>
          )}
        </div>
      )}
    </div>
  );
}
