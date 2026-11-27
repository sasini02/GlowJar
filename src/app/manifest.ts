import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glowjar",
    short_name: "Glowjar",
    description: "Collect the little lights. An anonymous diary of small wins.",
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#FBF7F0",
    theme_color: "#232B4D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
