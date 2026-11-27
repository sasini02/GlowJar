import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Download, Lock, LogOut, ShieldCheck } from "lucide-react";
import { CheerupsSwitch } from "@/components/push/cheerups-switch";
import { DeleteAccount } from "@/components/settings/delete-account";
import { SettingsForm } from "@/components/settings/settings-form";
import { ThemePicker } from "@/components/settings/theme-picker";
import { UsernameForm } from "@/components/settings/username-form";
import { signOut } from "@/lib/actions/auth";
import { requireOnboardedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your profile" };

const secondaryButton =
  "inline-flex h-12 w-fit items-center gap-2 rounded-md border border-line bg-surface-raised px-5 text-label text-ink transition-colors duration-200 hover:bg-surface";
const card = "rounded-[24px] bg-surface-raised p-5 shadow-card md:rounded-[28px] md:p-6";
const cardTitle = "font-serif text-[20px] leading-[26px] font-semibold";
const cardHint = "mt-0.5 text-label font-normal text-ink-muted";

export default function SettingsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-0.5">
        <h1 className="font-serif text-[28px] leading-[34px] font-semibold md:text-[36px] md:leading-[42px]">Your profile</h1>
        <p className="text-label font-normal text-ink-muted">Your name, reminders and privacy.</p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[28px] bg-surface-raised" />}>
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
      <section className={card}>
        <UsernameForm username={profile.username} />
      </section>

      <section className={card}>
        <SettingsForm
          nudgeTime={profile.nudge_time}
          glowReminders={profile.glow_reminders_enabled}
          quietStart={profile.quiet_start.slice(0, 5)}
          quietEnd={profile.quiet_end.slice(0, 5)}
          defaultVisibility={profile.default_visibility}
          timezone={profile.timezone}
        />
      </section>

      <section className={card}>
        <CheerupsSwitch initialEnabled={profile.cheerups_enabled} />
      </section>

      <section className={card}>
        <ThemePicker initial={profile.theme} />
      </section>

      {email && (
        <section className={card}>
          <h2 className={cardTitle}>Private email</h2>
          <p className="mt-2 break-all text-ink">{email}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-caption text-ink-muted">
            <Lock className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Only you can see this. It&apos;s used for sign-in links and letters, never shown to anyone.
          </p>
        </section>
      )}

      {profile.is_moderator && (
        <section className={card}>
          <h2 className={cardTitle}>Moderation</h2>
          <Link href="/moderation" className={`${secondaryButton} mt-3`}>
            <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Review reports
          </Link>
        </section>
      )}

      <section className={`${card} flex flex-col gap-4`}>
        <div>
          <h2 className={cardTitle}>Your data</h2>
          <p className={cardHint}>A JSON file with all your wins, letters and moods. Sealed letters stay sealed until their date.</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
        </div>
        <div className="border-t border-line pt-4">
          <DeleteAccount username={profile.username} />
        </div>
      </section>
    </>
  );
}
