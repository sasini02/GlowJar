"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { JarMark } from "@/components/brand/jar-mark";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "glowjar:install-dismissed";

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean(navigator.standalone));
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/** A quiet card offering to add Glowjar to the home screen. Shown once until dismissed. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS has no install event, so explain the Share menu instead.
    const iosTimer = isIosSafari() ? window.setTimeout(() => setShowIosHint(true), 0) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private browsing: the card just comes back next visit.
    }
    setDeferred(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!deferred && !showIosHint) return null;

  return (
    <aside
      aria-label="Install Glowjar"
      className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-start gap-3 rounded-lg bg-surface-raised p-4 shadow-lift md:bottom-6"
    >
      <JarMark className="size-8 shrink-0 text-dusk" />
      <div className="min-w-0 flex-1">
        <p className="text-label text-ink">Keep your jar on your home screen</p>
        {showIosHint ? (
          <p className="mt-1 text-caption text-ink-muted">
            Tap the Share button, then &ldquo;Add to Home Screen&rdquo;. Cheer-ups need this on iPhone.
          </p>
        ) : (
          <>
            <p className="mt-1 text-caption text-ink-muted">It opens like an app and can bring your wins back to you.</p>
            <button
              type="button"
              onClick={install}
              className="mt-3 inline-flex min-h-11 items-center rounded-md bg-glow px-4 text-label text-ink"
            >
              Add to home screen
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-ink-muted hover:text-ink"
      >
        <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </aside>
  );
}
