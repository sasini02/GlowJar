"use client";

import { useRef, useState } from "react";
import { Check, Moon, Plus } from "lucide-react";
import { ComposerDialog, type ComposerDialogHandle } from "@/components/wins/composer-dialog";
import type { JarStyle } from "@/lib/milestones";
import type { DayKind } from "@/lib/streak";
import { StreakJar } from "./streak-jar";
import { WeekRow } from "./week-row";

type StreakHeroProps = {
  current: number;
  restLeftThisWeek: number;
  todayLit: boolean;
  week: { date: string; kind: DayKind }[];
  today: string;
  totalLights: number;
  jarStyle: JarStyle;
  username: string;
  defaultPublic: boolean;
};

function statusLine({ current, todayLit, totalLights }: Pick<StreakHeroProps, "current" | "todayLit" | "totalLights">) {
  if (todayLit) return "Lovely. One more light in your jar.";
  if (current > 0) return "Your jar is glowing. Add a win to keep it lit tonight.";
  if (totalLights > 0) return "Your jar is resting. Add a win to start glowing again.";
  return "Add your first win to light up your jar.";
}

function restLine({ current, restLeftThisWeek, totalLights }: Pick<StreakHeroProps, "current" | "restLeftThisWeek" | "totalLights">) {
  if (current === 0) {
    return totalLights > 0
      ? `All ${totalLights} ${totalLights === 1 ? "light stays" : "lights stay"} in your jar.`
      : "Two rest days a week keep your streak safe.";
  }
  if (restLeftThisWeek === 0) return "Your rest days refill on Monday.";
  return `${restLeftThisWeek} rest ${restLeftThisWeek === 1 ? "day" : "days"} left this week. Your streak stays safe.`;
}

function RestLine({ text, className }: { text: string; className: string }) {
  return (
    <p className={`items-center gap-2 text-[13px] leading-[18px] text-[#C9CDE3] ${className}`}>
      <Moon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {text}
    </p>
  );
}

/**
 * The dusk streak card at the top of Home. On phones it holds the button that
 * opens the composer; on wider screens the composer sits beside it instead.
 */
export function StreakHero(props: StreakHeroProps) {
  const { current, todayLit, week, today, jarStyle, username, defaultPublic } = props;
  const dialogRef = useRef<ComposerDialogHandle>(null);
  // Remembered from the first render, so the glow plays only when today is lit while the page is open.
  const [litOnArrival] = useState(todayLit);
  const justLit = todayLit && !litOnArrival;
  const rest = restLine(props);

  return (
    <section
      aria-labelledby="streak-heading"
      className="flex h-full flex-col gap-[18px] rounded-[28px] bg-[#34406B] px-5 pt-6 pb-5 text-[#FBF7F0] shadow-lift md:gap-[22px] md:p-7"
    >
      <div className="flex items-center gap-4 md:flex-wrap md:gap-6">
        <StreakJar height={112} style={jarStyle} className="shrink-0 md:hidden" />
        <StreakJar height={140} style={jarStyle} className="hidden shrink-0 md:block" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:basis-60 md:gap-1">
          <h2 id="streak-heading" className="sr-only">
            Glow streak
          </h2>
          <p className="flex items-baseline gap-2 md:gap-2.5">
            <span
              className={`font-serif text-[64px] leading-[64px] font-bold text-[#F2B544] md:text-[80px] md:leading-[80px] ${
                justLit ? "light-up rounded-pill" : ""
              }`}
            >
              {current}
            </span>
            <span className="text-body font-semibold md:text-[20px] md:leading-7">
              <span className="md:hidden">{current === 1 ? "day" : "days"}</span>
              <span className="hidden md:inline">day glow streak</span>
            </span>
          </p>
          <span className="text-label text-[#C9CDE3] md:hidden">glow streak</span>
          <p role="status" className="mt-2 font-serif text-body leading-[22px] md:mt-1.5 md:text-[18px] md:leading-[26px]">
            {statusLine(props)}
          </p>
          <RestLine text={rest} className="mt-1 hidden md:flex" />
        </div>
      </div>

      <WeekRow week={week} today={today} justLit={justLit} />

      <div className="md:hidden">
        {todayLit ? (
          <p className="flex h-13 items-center justify-center gap-2 rounded-md bg-[#A9C9B2]/18 text-[15px] font-semibold text-[#DDEEDF]">
            <Check className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            Today is lit. See you tomorrow.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => dialogRef.current?.open()}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#F2B544] text-body font-bold text-[#2A2D3A]"
          >
            <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            Light up today
          </button>
        )}
      </div>

      <RestLine text={rest} className="flex md:hidden" />

      <ComposerDialog ref={dialogRef} username={username} defaultPublic={defaultPublic} stayOnSave />
    </section>
  );
}
