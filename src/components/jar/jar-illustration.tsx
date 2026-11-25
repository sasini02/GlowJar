import type { CSSProperties } from "react";

const MAX_DRAWN_LIGHTS = 48;
const PER_ROW = 6;

// Small, stable offsets so the lights look scattered but never move between renders.
function jitter(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 5;
}

function lightPosition(index: number) {
  const row = Math.floor(index / PER_ROW);
  const column = index % PER_ROW;
  return {
    cx: 48 + column * 13 + (row % 2) * 6 + jitter(index, 1),
    cy: 176 - row * 13 + jitter(index, 2),
    r: 4.5 + (jitter(index, 3) + 2.5) / 5,
  };
}

/** A jar that fills with one glowing dot per win, from the bottom up. */
export function JarIllustration({ lights, className = "" }: { lights: number; className?: string }) {
  const drawn = Math.min(lights, MAX_DRAWN_LIGHTS);

  return (
    <svg viewBox="0 0 160 200" className={className} role="img" aria-label={`A jar holding ${lights} ${lights === 1 ? "light" : "lights"}`}>
      <defs>
        <filter id="jar-light-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="56" y="8" width="48" height="14" rx="5" className="fill-on-dusk/80" />
      <path
        d="M60 28H100V36C100 43 128 49 128 66V168C128 181 118 192 104 192H56C42 192 32 181 32 168V66C32 49 60 43 60 36Z"
        className="fill-on-dusk/5 stroke-on-dusk/70"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <g filter="url(#jar-light-glow)">
        {Array.from({ length: drawn }, (_, index) => {
          const { cx, cy, r } = lightPosition(index);
          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={r}
              className="jar-light fill-glow"
              // Different lengths and negative delays keep the lights out of step from the first frame.
              style={
                {
                  "--twinkle-duration": `${4 + (index % 5) * 0.9}s`,
                  "--twinkle-delay": `${-(index * 0.7) % 5}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </g>
    </svg>
  );
}
