import { Suspense, type ReactNode } from "react";
import { OfflineQueueSync } from "@/components/pwa/offline-queue-sync";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { CelebrationToasts } from "@/components/realtime/celebration-toasts";
import { ThemeSync } from "@/components/settings/theme-sync";
import { TimezoneSync } from "@/components/settings/timezone-sync";
import { BottomNav } from "@/components/nav/bottom-nav";
import { LightsTodayCard } from "@/components/nav/lights-today-card";
import { Sidebar } from "@/components/nav/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { getProfile } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lg:flex">
        <Sidebar
          homeCard={
            <Suspense fallback={null}>
              <LightsTodayCard />
            </Suspense>
          }
        />
        <main className="w-full min-w-0 flex-1 px-5 pt-5 pb-32 md:px-8 md:pt-7 md:pb-12">{children}</main>
      </div>
      <BottomNav />
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
  if (!profile) return null;
  return (
    <>
      <ThemeSync theme={profile.theme} />
      <TimezoneSync saved={profile.timezone} />
    </>
  );
}
