"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Share, X } from "lucide-react";
import { JarOutlineIcon } from "@/components/ui/icons";
import { markMilestoneSeen } from "@/lib/actions/streak";
import { milestoneFor, nextMilestone } from "@/lib/milestones";
import { StreakJar } from "./streak-jar";

/** Full-screen celebration for a streak milestone. Shown once: closing it marks it seen. */
export function MilestoneSheet({ days }: { days: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [, startTransition] = useTransition();
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "failed">("idle");
  const milestone = milestoneFor(days);
  const next = nextMilestone(days);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  if (!milestone) return null;

  function close() {
    dialogRef.current?.close();
  }

  async function share() {
    if (!milestone) return;
    setShareStatus("working");
    try {
      const blob = await drawShareCard(days, milestone.title);
      const file = new File([blob], `glowjar-${days}-days.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: milestone.title });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
      setShareStatus("idle");
    } catch (error) {
      // Closing the share sheet without picking anything isn't a failure.
      setShareStatus(error instanceof DOMException && error.name === "AbortError" ? "idle" : "failed");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="milestone-title"
      // Escape, either button, or anything else that closes it counts as seen.
      onClose={() => startTransition(() => void markMilestoneSeen(days))}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-[#232B4D] p-0 text-[#FBF7F0] backdrop:bg-[#232B4D]"
    >
      <div className="relative mx-auto flex min-h-full max-w-[420px] flex-col items-center px-6 pt-6 pb-8">
        <Confetti />

        <div className="relative flex w-full justify-end">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="inline-flex size-11 items-center justify-center rounded-pill bg-white/8 text-[#FBF7F0]"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <StreakJar height={232} style={milestone.style} tone="sheet" className="relative mt-2" />

        <div className="relative mt-2 flex flex-col items-center gap-1.5 text-center">
          <span className="text-[13px] leading-[18px] font-semibold tracking-[0.08em] text-[#F7D48C] uppercase">
            New glow unlocked
          </span>
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-[80px] leading-[80px] font-bold text-[#F2B544]">{days}</span>
            <span className="font-serif text-[24px] leading-[30px] font-semibold">days</span>
          </p>
          <h2 id="milestone-title" className="mt-1 font-serif text-[26px] leading-8 font-semibold">
            {milestone.title}
          </h2>
          <p className="max-w-[300px] text-[15px] leading-[22px] text-[#C9CDE3]">{milestone.line}</p>
        </div>

        <div className="relative mt-6 flex w-full items-center gap-3.5 rounded-[20px] bg-white/7 px-4 py-3.5">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#F7D48C] text-[#2A2D3A]">
            <JarOutlineIcon className="size-6" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] leading-5 font-semibold">{milestone.reward} unlocked</span>
            <span className="text-[13px] leading-[18px] text-[#C9CDE3]">A new look for your jar and profile</span>
          </div>
        </div>

        {next && (
          <>
            <div className="relative mt-3 flex w-full justify-between text-caption font-normal text-[#C9CDE3]">
              <span>Next glow: {next} days</span>
              <span>{next - days} to go</span>
            </div>
            <div
              role="progressbar"
              aria-label={`Progress to the ${next}-day glow`}
              aria-valuemin={0}
              aria-valuemax={next}
              aria-valuenow={days}
              className="relative mt-1.5 h-2 w-full overflow-hidden rounded-pill bg-white/12"
            >
              <div className="h-2 rounded-pill bg-[#F2B544]" style={{ width: `${Math.round((days / next) * 100)}%` }} />
            </div>
          </>
        )}

        <div className="relative mt-auto flex w-full flex-col gap-2.5 pt-10">
          <button
            type="button"
            onClick={close}
            autoFocus
            className="h-[54px] rounded-md bg-[#F2B544] text-body font-bold text-[#2A2D3A]"
          >
            Keep glowing
          </button>
          <button
            type="button"
            onClick={share}
            disabled={shareStatus === "working"}
            className="flex h-[50px] items-center justify-center gap-2 rounded-md border border-[#C9CDE3]/40 text-[15px] font-semibold text-[#FBF7F0] disabled:opacity-60"
          >
            <Share className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            {shareStatus === "working" ? "Making your card…" : "Share anonymously"}
          </button>
          <p role="status" className="min-h-4 text-center text-caption font-normal text-[#C9CDE3]">
            {shareStatus === "failed" ? "We couldn't make the card in this browser. A screenshot works too." : ""}
          </p>
        </div>
      </div>
    </dialog>
  );
}

// A few still confetti dots and squares, placed as in the design.
function Confetti() {
  return (
    <svg
      viewBox="0 0 390 420"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] w-full"
      preserveAspectRatio="xMidYMin slice"
    >
      <circle cx="60" cy="90" r="4" fill="#E9785A" />
      <circle cx="320" cy="70" r="5" fill="#F2B544" />
      <circle cx="340" cy="190" r="3" fill="#E9785A" />
      <circle cx="44" cy="230" r="3" fill="#F7D48C" />
      <circle cx="110" cy="40" r="2.5" fill="#F7D48C" />
      <circle cx="290" cy="300" r="3" fill="#F2B544" />
      <circle cx="80" cy="330" r="4" fill="#E9785A" />
      <rect x="250" y="120" width="8" height="8" rx="2" fill="#F2B544" transform="rotate(30 254 124)" />
      <rect x="120" y="170" width="7" height="7" rx="2" fill="#E9785A" transform="rotate(-20 123 173)" />
    </svg>
  );
}

/** A square card with the milestone and no name on it, drawn with the page's own fonts. */
async function drawShareCard(days: number, title: string): Promise<Blob> {
  await document.fonts.ready;
  const styles = getComputedStyle(document.documentElement);
  const serif = `${styles.getPropertyValue("--font-serif-loaded").trim()}, Georgia, serif`;
  const sans = `${styles.getPropertyValue("--font-sans-loaded").trim()}, system-ui, sans-serif`;
  const size = 1080;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  context.fillStyle = "#232B4D";
  context.fillRect(0, 0, size, size);
  const halo = context.createRadialGradient(size / 2, 420, 0, size / 2, 420, 380);
  halo.addColorStop(0, "rgba(247, 212, 140, 0.35)");
  halo.addColorStop(1, "rgba(247, 212, 140, 0)");
  context.fillStyle = halo;
  context.fillRect(0, 0, size, size);

  context.textAlign = "center";
  context.fillStyle = "#F7D48C";
  context.font = `500 34px ${sans}`;
  context.fillText("NEW GLOW UNLOCKED", size / 2, 250);
  context.fillStyle = "#F2B544";
  context.font = `600 280px ${serif}`;
  context.fillText(String(days), size / 2, 560);
  context.fillStyle = "#FBF7F0";
  context.font = `500 44px ${sans}`;
  context.fillText("days of little lights", size / 2, 640);
  context.font = `600 56px ${serif}`;
  context.fillText(title, size / 2, 780, size - 160);
  context.fillStyle = "#C9CDE3";
  context.font = `500 32px ${sans}`;
  context.fillText("Glowjar · Collect the little lights.", size / 2, size - 110);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the image"))), "image/png"),
  );
}
