import type { ReactNode } from "react";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { TopBar } from "@/components/shell/top-bar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-28 md:px-8 md:pb-16">{children}</main>
      <BottomTabBar />
      <InstallPrompt />
      <ServiceWorkerRegistrar />
    </>
  );
}
