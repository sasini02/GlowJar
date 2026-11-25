import Link from "next/link";
import { JarMark } from "@/components/brand/jar-mark";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <JarMark className="size-12 text-dusk" />
      <h1 className="mt-8 font-serif text-display">Collect the little lights.</h1>
      <p className="mt-4 text-ink-muted">
        An anonymous diary of small wins. Keep them to yourself or share them quietly, and find them again on the
        hard days.
      </p>
      <Link
        href="/feed"
        className="mt-10 inline-flex min-h-11 w-fit items-center rounded-md bg-glow px-6 text-label text-ink shadow-card transition-shadow duration-200 hover:shadow-lift"
      >
        Look around
      </Link>
      <p className="mt-6 text-caption text-ink-muted">No password. Your email is never shown to anyone.</p>
    </main>
  );
}
