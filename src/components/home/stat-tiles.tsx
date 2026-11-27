import { CalendarDays } from "lucide-react";
import { JarOutlineIcon, SparkleIcon } from "@/components/ui/icons";
import { NextMilestoneTile } from "./next-milestone";

type StatTilesProps = {
  monthWins: number;
  /** "Nov" on phones, "November" wider. */
  monthShort: string;
  monthLong: string;
  totalLights: number;
  bestStreak: number;
  current: number;
};

/** Three counts on phones; wider, they sit side by side with the next milestone as a fourth tile. */
export function StatTiles({ monthWins, monthShort, monthLong, totalLights, bestStreak, current }: StatTilesProps) {
  const best = `${bestStreak} ${bestStreak === 1 ? "day" : "days"}`;
  const tiles = [
    {
      key: "month",
      tint: "bg-card-butter",
      icon: <CalendarDays className="size-[18px] text-glow-ink md:size-5" strokeWidth={1.75} aria-hidden="true" />,
      value: monthWins,
      label: <><span className="md:hidden">wins in {monthShort}</span><span className="hidden md:inline">wins in {monthLong}</span></>,
    },
    {
      key: "lights",
      tint: "bg-card-lilac",
      icon: <JarOutlineIcon className="size-[18px] text-dusk-ink md:size-5" />,
      value: totalLights,
      label: "lights in all",
    },
    {
      key: "best",
      tint: "bg-card-peach",
      icon: <SparkleIcon className="size-[18px] text-glow-ink md:size-5" />,
      value: best,
      label: "best streak",
    },
  ];

  return (
    <section aria-label="Your numbers">
      <ul className="grid grid-cols-3 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-4">
        {tiles.map((tile) => (
          <li
            key={tile.key}
            className={`flex flex-col gap-2.5 rounded-[20px] px-3 py-3.5 md:flex-row md:items-center md:gap-3.5 md:rounded-[22px] md:p-[18px] ${tile.tint}`}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-raised md:size-11 md:rounded-[14px]">
              {tile.icon}
            </span>
            <span>
              <span className="block font-serif text-[24px] leading-7 font-semibold text-ink md:text-[28px] md:leading-8">
                {tile.value}
              </span>
              <span className="block text-caption font-medium text-ink-muted-tint md:text-[13px]">{tile.label}</span>
            </span>
          </li>
        ))}
        <li className="hidden md:flex">
          <NextMilestoneTile current={current} />
        </li>
      </ul>
    </section>
  );
}
