import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FocusTrack",
    short_name: "FocusTrack",
    description: "Modern productivity platform for tasks, notes, focus and analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#6366F1",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
