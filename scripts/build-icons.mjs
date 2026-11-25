// Exports the PNG icons the web app manifest and iOS need from the SVGs in design/icons.
// Run with `npm run icons` after changing an icon.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (name) => path.join(root, "design", "icons", name);
const outDir = path.join(root, "public", "icons");

const exports = [
  { from: "glowjar-app-icon.svg", to: "icon-192.png", size: 192 },
  { from: "glowjar-app-icon.svg", to: "icon-512.png", size: 512 },
  { from: "glowjar-maskable-icon.svg", to: "maskable-512.png", size: 512 },
  { from: "glowjar-app-icon.svg", to: "apple-touch-icon.png", size: 180 },
  // Notification badge: the single-colour mark, which Android tints itself.
  { from: "glowjar-mark.svg", to: "badge-96.png", size: 96 },
];

await mkdir(outDir, { recursive: true });

for (const { from, to, size } of exports) {
  await sharp(source(from), { density: 384 }).resize(size, size).png().toFile(path.join(outDir, to));
  console.log(`public/icons/${to} (${size}px)`);
}
