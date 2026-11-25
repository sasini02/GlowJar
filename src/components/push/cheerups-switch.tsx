"use client";

import { useState, useTransition } from "react";
import { disableCheerups, enableCheerups } from "@/lib/actions/push";
import { pushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push/client";

type CheerupsSwitchProps = {
  initialEnabled: boolean;
  /** Called after the preference is saved, e.g. to update a surrounding form. */
  onChange?: (enabled: boolean) => void;
};

/** The weekly cheer-ups switch. Turning it on asks for notification permission and subscribes this browser. */
export function CheerupsSwitch({ initialEnabled, onChange }: CheerupsSwitchProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setNote(null);
    startTransition(async () => {
      if (enabled) {
        const endpoint = await unsubscribeFromPush().catch(() => null);
        const result = await disableCheerups(endpoint);
        if (result.error) return setNote(result.error);
        setEnabled(false);
        onChange?.(false);
        return;
      }

      if (!pushSupported()) {
        return setNote(
          "This browser can't receive notifications. On iPhone, add Glowjar to your home screen first, then turn this on there.",
        );
      }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        return setNote("Notifications aren't set up on this server yet.");
      }

      const subscription = await subscribeToPush().catch((error) => {
        console.error("Push subscription failed", error);
        return null;
      });
      if (!subscription) {
        return setNote("Notifications are off for Glowjar. You can allow them in your browser settings, then try again.");
      }

      const result = await enableCheerups(subscription);
      if (result.error) return setNote(result.error);
      setEnabled(true);
      onChange?.(true);
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 rounded-md border border-line bg-surface-raised p-4">
        <div>
          <p id="cheerups-label" className="text-label text-ink">
            Weekly cheer-ups
          </p>
          <p id="cheerups-hint" className="mt-1 text-caption text-ink-muted">
            Once a week we send back one of your own past wins, at a quiet, random moment.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="cheerups-label"
          aria-describedby="cheerups-hint"
          aria-busy={pending}
          disabled={pending}
          onClick={toggle}
          className={`relative inline-flex h-8 w-13 shrink-0 items-center rounded-pill transition-colors duration-200 disabled:opacity-70 ${
            enabled ? "bg-dusk" : "bg-line"
          }`}
        >
          <span
            className={`inline-block size-6 rounded-pill bg-surface-raised shadow-card transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {note && (
        <p role="status" className="mt-2 text-caption text-ink-muted">
          {note}
        </p>
      )}
    </div>
  );
}
