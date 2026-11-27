import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { formatAgo } from "@/lib/time";
import type { WinView } from "@/lib/wins/queries";
import { CheerButton } from "./cheer-button";

/** A few recent public wins from other people to celebrate. Two side by side on phones, three wider. */
export function CheerList({ wins, now }: { wins: WinView[]; now: number }) {
  return (
    <section aria-labelledby="cheer-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="cheer-heading" className="font-serif text-[20px] leading-[26px] font-semibold md:text-[22px] md:leading-7">
          Could use a cheer
        </h2>
        <Link href="/feed" className="text-label font-semibold text-glow-ink hover:underline">
          <span className="md:hidden">Open feed</span>
          <span className="hidden md:inline">Open the feed</span>
        </Link>
      </div>
      {wins.length === 0 ? (
        <p className="text-label font-normal text-ink-muted">Everyone&apos;s been cheered for now. Check the feed later.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] md:gap-4">
          {wins.map((win, index) => (
            <li
              key={win.id}
              className={`flex flex-col gap-3 rounded-[24px] p-4 md:gap-3.5 md:p-5 ${CATEGORIES[win.category].tint} ${index >= 2 ? "max-md:hidden" : ""}`}
            >
              <p className="font-serif text-body leading-[23px] break-words text-ink md:text-[17px] md:leading-[25px]">{win.text}</p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-caption font-medium text-ink-muted-tint">
                  {win.username} · {formatAgo(win.createdAt, now)}
                </span>
                <CheerButton winId={win.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
