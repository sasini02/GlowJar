import Link from "next/link";
import { JarMark } from "@/components/brand/jar-mark";

/** The "Your jar" card mixed into the feed. */
export function JarCard({ monthCount }: { monthCount: number }) {
  const lights = monthCount === 1 ? "light" : "lights";
  return (
    <Link
      href="/jar"
      className="group mb-6 block break-inside-avoid rounded-lg bg-dusk p-7 text-on-dusk shadow-card transition-shadow duration-200 hover:shadow-lift"
    >
      <JarMark className="size-10 text-glow" />
      <p className="mt-4 text-label opacity-80">Your jar</p>
      <p className="mt-1 font-serif text-title">
        {monthCount === 0 ? "Ready for its first light this month" : `${monthCount} ${lights} this month`}
      </p>
      <p className="mt-4 text-label underline-offset-4 group-hover:underline">Open my jar</p>
    </Link>
  );
}
