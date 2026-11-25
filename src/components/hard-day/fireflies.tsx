// Fixed positions so the server and browser render the same thing.
const FIREFLIES = [
  { left: "8%", top: "18%", size: 6, delay: "0s", duration: "9s" },
  { left: "22%", top: "72%", size: 4, delay: "2s", duration: "11s" },
  { left: "35%", top: "12%", size: 5, delay: "4s", duration: "10s" },
  { left: "48%", top: "85%", size: 6, delay: "1s", duration: "12s" },
  { left: "63%", top: "28%", size: 4, delay: "3s", duration: "9s" },
  { left: "76%", top: "64%", size: 7, delay: "5s", duration: "13s" },
  { left: "88%", top: "20%", size: 5, delay: "2.5s", duration: "10s" },
  { left: "92%", top: "80%", size: 4, delay: "6s", duration: "11s" },
  { left: "15%", top: "45%", size: 5, delay: "7s", duration: "12s" },
  { left: "56%", top: "52%", size: 3, delay: "1.5s", duration: "9s" },
];

/** Soft drifting lights behind the Hard Day screen. Static when reduced motion is on. */
export function Fireflies() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {FIREFLIES.map((firefly, index) => (
        <span
          key={index}
          className="firefly absolute rounded-pill bg-glow-soft"
          style={{
            left: firefly.left,
            top: firefly.top,
            width: firefly.size,
            height: firefly.size,
            animationDelay: firefly.delay,
            animationDuration: firefly.duration,
          }}
        />
      ))}
    </div>
  );
}
