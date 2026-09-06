import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard/pos",
    name: `${appConfig.name} Inventory & POS`,
    short_name: appConfig.name,
    description: appConfig.description,
    start_url: "/dashboard/pos",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0B3D91",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/brand/inventman-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/inventman-favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
