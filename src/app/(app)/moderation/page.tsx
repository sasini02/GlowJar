import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ReportDecision } from "@/components/moderation/report-decision";
import { requireOnboardedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reports" };

export default function ModerationPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <h1 className="font-serif text-display">Reports</h1>
        <p className="mt-2 text-ink-muted">
          Removing a win only takes it out of the feed. It stays in its author&apos;s jar as a private win.
        </p>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-surface-raised" />}>
        <OpenReports />
      </Suspense>
    </div>
  );
}

async function OpenReports() {
  const profile = await requireOnboardedProfile();
  if (!profile.is_moderator) notFound();

  const supabase = await createClient();
  const { data: reports, error } = await supabase.rpc("open_reports");
  if (error) throw error;

  if (!reports.length) return <p className="text-ink-muted">No open reports. All quiet.</p>;

  return (
    <ul className="flex flex-col gap-6">
      {reports.map((report) => (
        <li key={report.win_id} className="rounded-lg bg-surface-raised p-6 shadow-card">
          {report.win_emoji && <p className="mb-2 text-win-emoji">{report.win_emoji}</p>}
          <p className="font-serif text-win-text break-words whitespace-pre-line">{report.win_text}</p>
          <p className="mt-4 text-label text-ink-muted">
            {report.report_count === 1 ? "1 report" : `${report.report_count} reports`}
            {!report.is_public && " · already hidden from the feed"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[...new Set(report.reasons)].map((reason) => (
              <li key={reason} className="rounded-pill bg-surface px-3 py-1 text-caption text-ink">
                {reason}
              </li>
            ))}
          </ul>
          <ReportDecision winId={report.win_id} />
        </li>
      ))}
    </ul>
  );
}
