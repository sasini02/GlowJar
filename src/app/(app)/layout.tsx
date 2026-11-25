import { Suspense, type ReactNode } from "react";
import { OfflineQueueSync } from "@/components/pwa/offline-queue-sync";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { CelebrationToasts } from "@/components/realtime/celebration-toasts";
import { ThemeSync } from "@/components/settings/theme-sync";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { TopBar } from "@/components/shell/top-bar";
import { Toaster } from "@/components/ui/toaster";
import { getProfile } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-28 md:px-8 md:pb-16">{children}</main>
      <BottomTabBar />
      <InstallPrompt />
      <ServiceWorkerRegistrar />
      <Toaster />
      <CelebrationToasts />
      <OfflineQueueSync />
      <Suspense fallback={null}>
        <ProfileTheme />
      </Suspense>
    </>
  );
}

async function ProfileTheme() {
  const profile = await getProfile();
  return profile ? <ThemeSync theme={profile.theme} /> : null;
}
