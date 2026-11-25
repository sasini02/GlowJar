import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { signOut } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "You" };

export default function SettingsPage() {
  return (
    <>
      <PagePlaceholder title="You" description="Your username, reminders, quiet hours and data." />
      <form action={signOut} className="flex justify-center">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center gap-2 rounded-md border border-line px-6 text-label text-ink transition-colors duration-200 hover:bg-surface-raised"
        >
          <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Sign out
        </button>
      </form>
    </>
  );
}
