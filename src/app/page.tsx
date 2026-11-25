import { Suspense } from "react";
import { JarMark } from "@/components/brand/jar-mark";
import { LinkErrorNotice } from "@/components/auth/link-error-notice";
import { SignInForm } from "@/components/auth/sign-in-form";
import { WinTile } from "@/components/wins/win-tile";
import type { WinCategory } from "@/lib/categories";

const SAMPLE_WINS: { text: string; emoji: string | null; category: WinCategory }[] = [
  { text: "Drank water before coffee. Small, but I noticed.", emoji: "💧", category: "health" },
  { text: "Asked for help with the report instead of struggling alone.", emoji: null, category: "work" },
  { text: "Texted an old friend first.", emoji: "💌", category: "social" },
  { text: "Sat with a worry for a minute and let it pass.", emoji: "🌊", category: "mind" },
  { text: "Practised piano for ten minutes.", emoji: "🎹", category: "learning" },
  { text: "Took a nap without feeling guilty about it.", emoji: "🛌", category: "self_care" },
  { text: "Walked the long way home through the park.", emoji: "🍂", category: "health" },
  { text: "Finished the thing I'd been avoiding all week.", emoji: "✅", category: "work" },
  { text: "Made soup and shared it with my neighbour.", emoji: "🍲", category: "social" },
];

export default function WelcomePage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-16">
        <JarMark className="size-12 text-dusk" />
        <h1 className="mt-8 font-serif text-display">Collect the little lights.</h1>
        <p className="mt-4 mb-10 text-ink-muted">
          An anonymous diary of small wins. Keep them to yourself or share them quietly, and find them again on the
          hard days.
        </p>
        <Suspense fallback={null}>
          <LinkErrorNotice />
        </Suspense>
        <SignInForm />
        <p className="mt-6 text-caption text-ink-muted">No password. Your email is never shown to anyone.</p>
      </main>

      {/* Decorative: a fading wall of sample lights beside the form on wide screens. */}
      <div
        aria-hidden="true"
        className="relative hidden h-dvh overflow-hidden bg-surface lg:sticky lg:top-0 lg:block [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_70%,transparent)]"
      >
        <div className="columns-2 gap-6 p-8 opacity-90 2xl:columns-3">
          {SAMPLE_WINS.map((win) => (
            <WinTile key={win.text} {...win} className="mb-6 break-inside-avoid" />
          ))}
        </div>
      </div>
    </div>
  );
}
