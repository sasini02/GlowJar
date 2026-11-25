"use client";

import { useEffect } from "react";
import { showToast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";

const MESSAGES: Record<Enums<"celebration_type">, string> = {
  celebrate: "Someone celebrated your win 🎉",
  proud: "Someone is proud of your win 💪",
  metoo: "Someone felt your win too 🤗",
};

type CelebrationRow = { win_id: string; user_id: string; type: Enums<"celebration_type"> };

/**
 * Listens for new celebrations while the app is open. Realtime applies the
 * celebrations RLS policy, so the only rows that arrive are reactions on the
 * viewer's own wins and the viewer's own reactions (ignored below). The toast
 * never says who celebrated: the feed stays anonymous.
 */
export function CelebrationToasts() {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session || cancelled) return;

      await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`celebrations:${session.user.id}`)
        .on<CelebrationRow>("postgres_changes", { event: "INSERT", schema: "public", table: "celebrations" }, (payload) => {
          if (payload.new.user_id === session.user.id) return;
          showToast({ message: MESSAGES[payload.new.type] ?? MESSAGES.celebrate, href: "/jar", linkLabel: "My jar" });
        })
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
