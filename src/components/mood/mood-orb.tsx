import type { CSSProperties, ReactNode } from "react";
import { moodStyle } from "@/lib/mood";

type MoodOrbProps = {
  level: number;
  /** Diameter in pixels. */
  size: number;
  /** Draw the eyes and mouth. Off for calendar days, which show a date instead. */
  face?: boolean;
  /** Bolder face for the small one-tap orbs. */
  compact?: boolean;
  /** The soft coloured halo around the large check-in orb. */
  glow?: boolean;
  className?: string;
  children?: ReactNode;
};

// Faces and dates stay dark on every orb colour in both themes, like text on glow.
const FACE_INK = "#2A2D3A";

/** A mood on the shared seven-step scale: a glowing orb with a simple face. Decorative; label it where it's used. */
export function MoodOrb({ level, size, face = true, compact = false, glow = false, className = "", children }: MoodOrbProps) {
  const { color, mouth, compactMouth } = moodStyle(level);
  const halo = Math.round(size * 0.105);
  const faceSize = Math.round(size * (compact ? 0.68 : 0.7));

  return (
    <span
      aria-hidden="true"
      className={`mood-orb relative inline-flex shrink-0 items-center justify-center rounded-pill ${className}`}
      style={
        {
          width: size,
          height: size,
          "--orb-color": color,
          boxShadow: glow ? `0 0 0 ${halo}px ${color}33, 0 18px 50px ${color}88` : undefined,
        } as CSSProperties
      }
    >
      {face && (
        <svg viewBox="-60 -60 120 120" width={faceSize} height={faceSize}>
          <circle cx={-14} cy={-6} r={compact ? 6 : 4.5} fill={FACE_INK} />
          <circle cx={14} cy={-6} r={compact ? 6 : 4.5} fill={FACE_INK} />
          <path
            d={compact ? compactMouth : mouth}
            className="mood-mouth"
            fill="none"
            stroke={FACE_INK}
            strokeWidth={compact ? 6 : 3.5}
            strokeLinecap="round"
          />
        </svg>
      )}
      {children && (
        <span className="relative font-bold" style={{ color: FACE_INK }}>
          {children}
        </span>
      )}
    </span>
  );
}
