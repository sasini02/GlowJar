import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JarMark } from "@/components/brand/jar-mark";
import { SetupForm } from "@/components/setup/setup-form";
import { getProfile, requireUserId } from "@/lib/auth";

export const metadata: Metadata = { title: "Set up your jar" };

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 py-12">
      <JarMark className="size-10 text-dusk" />
      <h1 className="mt-6 font-serif text-display">Let&apos;s set up your jar.</h1>
      <p className="mt-3 mb-10 text-ink-muted">Three small choices, then you can add your first light.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-raised" />}>
        <SetupFormLoader />
      </Suspense>
    </main>
  );
}

async function SetupFormLoader() {
  await requireUserId();
  const profile = await getProfile();
  if (!profile) redirect("/");
  if (profile.onboarded_at) redirect("/home");

  return (
    <SetupForm
      initialUsername={profile.username}
      initialNudgeTime={profile.nudge_time}
      initialCheerupsEnabled={profile.cheerups_enabled}
    />
  );
}
