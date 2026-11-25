import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WinComposer } from "@/components/wins/win-composer";
import { requireOnboardedProfile } from "@/lib/auth";
import { getOwnWin } from "@/lib/wins/queries";

export const metadata: Metadata = { title: "Edit win" };

export default function EditWinPage({ params, searchParams }: PageProps<"/wins/[id]/edit">) {
  return (
    <section className="mx-auto max-w-xl md:rounded-lg md:bg-surface-raised md:p-8 md:shadow-lift">
      <h1 className="mb-6 font-serif text-title">Edit your win</h1>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-surface-raised" />}>
        <EditWinComposer params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function EditWinComposer({ params, searchParams }: Pick<PageProps<"/wins/[id]/edit">, "params" | "searchParams">) {
  const profile = await requireOnboardedProfile();
  const { id } = await params;
  const { returnTo } = await searchParams;

  const win = await getOwnWin(profile.user_id, id);
  if (!win) notFound();

  return (
    <WinComposer
      username={profile.username}
      winId={win.id}
      returnTo={typeof returnTo === "string" ? returnTo : "/jar"}
      initial={{ text: win.text, emoji: win.emoji, category: win.category, isPublic: win.isPublic }}
    />
  );
}
