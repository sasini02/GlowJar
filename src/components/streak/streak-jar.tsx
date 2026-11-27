import type { JarStyle } from "@/lib/milestones";

type JarLook = { moon: string; sparkle: string; halo: string };

// Each milestone unlocks a jar with its own light. Classic is the design's jar exactly.
const LOOKS: Record<JarStyle, JarLook> = {
  classic: { moon: "#F2B544", sparkle: "#F7D48C", halo: "#F7D48C" },
  ember: { moon: "#F2B544", sparkle: "#E9785A", halo: "#E9785A" },
  moonlit: { moon: "#F7D48C", sparkle: "#DCE8F6", halo: "#DCE8F6" },
  firefly: { moon: "#F2B544", sparkle: "#F7D48C", halo: "#F2B544" },
  aurora: { moon: "#F7D48C", sparkle: "#A9C9B2", halo: "#A9C9B2" },
  starlit: { moon: "#F2B544", sparkle: "#E7E0F4", halo: "#E7E0F4" },
  lantern: { moon: "#F7D48C", sparkle: "#F2B544", halo: "#F2B544" },
};

type StreakJarProps = {
  /** Height in pixels; the width follows the jar's 120:140 shape. */
  height: number;
  style?: JarStyle;
  /** "card" sits on the dusk streak card; "sheet" is the brighter jar on the milestone screen. */
  tone?: "card" | "sheet";
  className?: string;
};

/** The streak jar: a cork, a lid band, dark glass, a crescent moon and a few sparkles. Decorative. */
export function StreakJar({ height, style = "classic", tone = "card", className = "" }: StreakJarProps) {
  const look = LOOKS[style];
  const glass = tone === "sheet" ? "#34406B" : "#232B4D";
  const rim = tone === "sheet" ? "#9AA5D6" : "#7F8BBE";

  return (
    <svg
      viewBox="0 0 120 140"
      width={Math.round((height * 120) / 140)}
      height={height}
      className={className}
      aria-hidden="true"
    >
      {tone === "sheet" ? (
        <>
          <circle cx="60" cy="84" r="58" fill={look.halo} opacity="0.16" />
          <circle cx="60" cy="84" r="42" fill={look.halo} opacity="0.14" />
        </>
      ) : (
        <circle cx="60" cy="84" r="54" fill={look.halo} opacity="0.18" />
      )}
      <rect x="44" y="6" width="32" height="14" rx="4" fill="#C99A5B" />
      <rect x="38" y="18" width="44" height="10" rx="4" fill="#4A5689" />
      <path
        d="M30 30h60a14 14 0 0 1 14 14v70a20 20 0 0 1-20 20H36a20 20 0 0 1-20-20V44a14 14 0 0 1 14-14z"
        fill={glass}
        stroke={rim}
        strokeWidth="2"
      />
      <circle cx="60" cy="80" r={tone === "sheet" ? 22 : 20} fill={look.moon} />
      <circle cx={tone === "sheet" ? 70 : 69} cy={tone === "sheet" ? 72 : 73} r={tone === "sheet" ? 18 : 17} fill={glass} />
      <circle cx="36" cy="56" r="3" fill={look.sparkle} />
      <circle cx="86" cy="104" r="2.5" fill={look.sparkle} />
      <circle cx="80" cy="52" r="2" fill={look.sparkle} />
      <circle cx="40" cy="112" r="2" fill={look.sparkle} />
      {tone === "sheet" && <circle cx="64" cy="118" r="2" fill={look.sparkle} />}
      <path d="M26 44q4-8 10-10" stroke={rim} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
