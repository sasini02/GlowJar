"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/toaster";
import { saveQueuedWin } from "@/lib/actions/wins";
import { pendingWinsFor, rememberOwner, removePendingWin } from "@/lib/offline/queue";
import { createClient } from "@/lib/supabase/client";

/** Moves wins written offline into the jar once the device is back online. */
export function OfflineQueueSync() {
  const router = useRouter();

  useEffect(() => {
    let running = false;

    async function flush() {
      if (running || !navigator.onLine || !("indexedDB" in window)) return;
      running = true;
      try {
        const { data } = await createClient().auth.getSession();
        const userId = data.session?.user.id;
        if (!userId) return;
        rememberOwner(userId);

        let saved = 0;
        for (const win of await pendingWinsFor(userId)) {
          const result = await saveQueuedWin({
            text: win.text,
            emoji: win.emoji,
            category: win.category,
            isPublic: win.isPublic,
          });
          // Keep it on the device and try again next time we're online.
          if (result.status === "retry") break;

          await removePendingWin(win.id);
          if (result.status === "saved") saved += 1;
          if (result.status === "saved_private") {
            saved += 1;
            showToast({ message: `A win you wrote offline is in your jar as Just me. ${result.message}` });
          }
          if (result.status === "invalid") {
            showToast({ message: `A win you wrote offline couldn't be saved: ${result.message}` });
          }
        }

        if (saved > 0) {
          showToast({
            message:
              saved === 1
                ? "The win you wrote offline is in your jar now."
                : `The ${saved} wins you wrote offline are in your jar now.`,
            href: "/jar",
            linkLabel: "My jar",
          });
          router.refresh();
        }
      } catch (error) {
        console.error("Offline queue sync failed", error);
      } finally {
        running = false;
      }
    }

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [router]);

  return null;
}
