"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type Toast = { id: number; message: string; href?: string; linkLabel?: string };

const EVENT = "glowjar:toast";
const VISIBLE_MS = 6000;

/** Shows a quiet message in the corner. Safe to call from any client code. */
export function showToast(toast: Omit<Toast, "id">) {
  window.dispatchEvent(new CustomEvent<Omit<Toast, "id">>(EVENT, { detail: toast }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    function onToast(event: Event) {
      const id = ++nextId;
      const { detail } = event as CustomEvent<Omit<Toast, "id">>;
      // Keep at most three on screen so a burst of celebrations never covers the page.
      setToasts((current) => [...current.slice(-2), { ...detail, id }]);
      const timer = setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        timers.delete(timer);
      }, VISIBLE_MS);
      timers.add(timer);
    }

    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md bg-dusk py-2 pr-2 pl-5 text-label text-on-dusk shadow-lift"
        >
          <p className="flex-1 py-2">{toast.message}</p>
          {toast.href && (
            <Link href={toast.href} className="shrink-0 font-semibold underline underline-offset-4">
              {toast.linkLabel ?? "See it"}
            </Link>
          )}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill opacity-80 hover:opacity-100"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
