import type { MetadataRoute } from "next";
import { getPublicEnvironment } from "@/lib/env/public";
import { publicRoutePaths } from "@/lib/marketing/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicEnvironment().NEXT_PUBLIC_APP_URL;
  return publicRoutePaths.map((path) => ({ url: new URL(path, base).toString(), changeFrequency: path === "/pricing" ? "weekly" : "monthly", priority: path === "/" ? 1 : path.split("/").length === 2 ? 0.8 : 0.7 }));
}
