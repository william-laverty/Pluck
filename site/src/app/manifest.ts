import type { MetadataRoute } from "next";
import { DESCRIPTION, TITLE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: TITLE,
    short_name: "Pluck",
    description: DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
  };
}
