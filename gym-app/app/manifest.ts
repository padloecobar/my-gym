import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gym Runner",
    short_name: "Gym Runner",
    description: "Offline-first workout runner for strength training.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f1",
    theme_color: "#fff9f1",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
