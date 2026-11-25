"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push/client";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Development reloads would keep a stale worker around; register only in production builds.
    if (process.env.NODE_ENV !== "production") return;
    registerServiceWorker().catch((error) => console.error("Service worker registration failed", error));
  }, []);

  return null;
}
