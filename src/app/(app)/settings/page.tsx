import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Download, Lock, LogOut, ShieldCheck } from "lucide-react";
import { CheerupsSwitch } from "@/components/push/cheerups-switch";
import { DeleteAccount } from "@/components/settings/delete-account";
import { SettingsForm } from "@/components/settings/settings-form";
import { ThemePicker } from "@/components/settings/theme-picker";
import { signOut } from "@/lib/actions/auth";
import { requireOnboardedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "You" };

const secondaryButton =
  "inline-flex min-h-12 w-fit items-center gap-2 rounded-md border border-line px-6 text-label text-ink transition-colors duration-200 hover:bg-surface-raised";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-10">
      <h1 className="font-serif text-display">You</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-surface-raised" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims.email === "string" ? data.claims.email : null;

  return (
    <>
      <SettingsForm
        username={profile.username}
        nudgeTime={profile.nudge_time}
        quietStart={profile.quiet_start.slice(0, 5)}
        quietEnd={profile.quiet_end.slice(0, 5)}
        defaultVisibility={profile.default_visibility}
        timezone={profile.timezone}
      />

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-title">Weekly cheer-ups</h2>
        <CheerupsSwitch initialEnabled={profile.cheerups_enabled} />
      </section>

      <ThemePicker initial={profile.theme} />

      {email && (
        <section>
          <h2 className="font-serif text-title">Private email</h2>
          <p className="mt-2 break-all text-ink">{email}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-caption text-ink-muted">
            <Lock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            Only you can see this. It&apos;s used for sign-in links and letters, never shown to anyone.
          </p>
        </section>
      )}

      {profile.is_moderator && (
        <Link href="/moderation" className={secondaryButton}>
          <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Review reports
        </Link>
      )}

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className="font-serif text-title">Your data</h2>
        <p className="-mt-2 text-ink-muted">
          A JSON file with all your wins and letters. Sealed letters stay sealed until their date.
        </p>
        {/* A plain link: the route sends the file as a download. */}
        <a href="/settings/export" download className={secondaryButton}>
          <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Download my data
        </a>
        <form action={signOut}>
          <button type="submit" className={secondaryButton}>
            <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Sign out
          </button>
        </form>
        <DeleteAccount username={profile.username} />
      </section>
    </>
  );
}
