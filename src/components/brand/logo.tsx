import Link from "next/link";
import { JarMark } from "./jar-mark";

export function Logo() {
  return (
    <Link
      href="/home"
      className="inline-flex min-h-11 items-center gap-2 rounded-md font-serif text-title text-ink"
    >
      <JarMark className="size-7 text-dusk" />
      Glowjar
    </Link>
  );
}
