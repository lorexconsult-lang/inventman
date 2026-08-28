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
    background_color: "#f7f7f3",
    theme_color: "#24483b",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icons/maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
