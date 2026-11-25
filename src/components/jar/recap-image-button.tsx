"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type RecapImageButtonProps = {
  fileName: string;
  title: string;
  total: number;
  /** cssVar names the category tint token, so the image uses the same colours as the page. */
  byCategory: { label: string; cssVar: string; lights: number }[];
  topWin: { text: string; emoji: string | null } | null;
};

const WIDTH = 1080;
const HEIGHT = 1350;
const PADDING = 96;

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  }
  return lines;
}

/** Draws the recap onto a canvas with the page's own fonts and colours, then downloads it as a PNG. */
async function drawRecap({ title, total, byCategory, topWin }: Omit<RecapImageButtonProps, "fileName">): Promise<Blob> {
  await document.fonts.ready;
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const serif = `${token("--font-serif-loaded")}, Georgia, serif`;
  const sans = `${token("--font-sans-loaded")}, system-ui, sans-serif`;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  context.fillStyle = token("--dusk");
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = token("--on-dusk");
  context.font = `500 34px ${sans}`;
  context.fillText("Monthly recap", PADDING, PADDING + 34);
  context.font = `600 84px ${serif}`;
  context.fillText(title, PADDING, PADDING + 140);

  context.fillStyle = token("--glow");
  context.font = `600 200px ${serif}`;
  context.fillText(String(total), PADDING, PADDING + 360);
  context.fillStyle = token("--on-dusk");
  context.font = `400 38px ${sans}`;
  context.fillText(total === 1 ? "light in my jar" : "little lights in my jar", PADDING, PADDING + 420);

  let y = PADDING + 510;
  const barLeft = PADDING + 230;
  const barWidth = WIDTH - barLeft - PADDING - 70;
  const most = byCategory[0]?.lights ?? 1;
  for (const { label, cssVar, lights } of byCategory.slice(0, 6)) {
    context.fillStyle = token("--on-dusk");
    context.font = `500 32px ${sans}`;
    context.fillText(label, PADDING, y + 26);
    context.fillText(String(lights), barLeft + barWidth + 28, y + 26);
    context.fillStyle = token(cssVar);
    context.beginPath();
    context.roundRect(barLeft, y, Math.max(24, (lights / most) * barWidth), 32, 16);
    context.fill();
    y += 58;
  }

  if (topWin) {
    y += 30;
    const boxHeight = HEIGHT - y - PADDING - 70;
    context.fillStyle = token("--surface-raised");
    context.beginPath();
    context.roundRect(PADDING, y, WIDTH - PADDING * 2, boxHeight, 32);
    context.fill();

    context.fillStyle = token("--ink-muted");
    context.font = `500 28px ${sans}`;
    context.fillText("Most celebrated", PADDING + 48, y + 64);
    context.fillStyle = token("--ink");
    context.font = `400 40px ${serif}`;
    const text = topWin.emoji ? `${topWin.emoji} ${topWin.text}` : topWin.text;
    const maxLines = Math.max(1, Math.floor((boxHeight - 110) / 56));
    wrapLines(context, text, WIDTH - PADDING * 2 - 96, maxLines).forEach((line, index) => {
      context.fillText(line, PADDING + 48, y + 124 + index * 56);
    });
  }

  context.fillStyle = token("--on-dusk");
  context.font = `500 30px ${sans}`;
  context.fillText("Glowjar · Collect the little lights.", PADDING, HEIGHT - PADDING + 20);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the image"))), "image/png"),
  );
}

export function RecapImageButton({ fileName, ...recap }: RecapImageButtonProps) {
  const [status, setStatus] = useState<"idle" | "working" | "failed">("idle");

  async function save() {
    setStatus("working");
    try {
      const blob = await drawRecap(recap);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={save}
        disabled={status === "working"}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line px-6 text-label text-ink transition-colors duration-200 hover:bg-surface-raised disabled:opacity-60"
      >
        <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {status === "working" ? "Making your image…" : "Save as image"}
      </button>
      {status === "failed" && (
        <p role="alert" className="text-caption text-danger">
          We couldn&apos;t make the image in this browser. A screenshot works too.
        </p>
      )}
    </div>
  );
}
