import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { CheerupsSwitch } from "@/components/push/cheerups-switch";
import { signOut } from "@/lib/actions/auth";
import { requireOnboardedProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "You" };

// Cheer-ups and sign-out for now; the full settings screen arrives in Phase 4.
export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <h1 className="font-serif text-display">You</h1>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-surface-raised" />}>
        <SettingsContent />
      </Suspense>
      <form action={signOut}>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center gap-2 rounded-md border border-line px-6 text-label text-ink transition-colors duration-200 hover:bg-surface-raised"
        >
          <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Sign out
        </button>
      </form>
    </div>
  );
}

async function SettingsContent() {
  const profile = await requireOnboardedProfile();

  return (
    <>
      <p className="-mt-4 text-ink-muted">
        Signed in as <span className="font-semibold text-ink">{profile.username}</span>.
      </p>
      <CheerupsSwitch initialEnabled={profile.cheerups_enabled} />
      {profile.is_moderator && (
        <Link
          href="/moderation"
          className="inline-flex min-h-12 w-fit items-center gap-2 rounded-md border border-line px-6 text-label text-ink transition-colors duration-200 hover:bg-surface-raised"
        >
          <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Review reports
        </Link>
      )}
    </>
  );
}
