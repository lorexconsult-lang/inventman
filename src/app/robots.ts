import type { MetadataRoute } from "next";
import { getPublicEnvironment } from "@/lib/env/public";
import { publicIndexingEnabled } from "@/lib/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicEnvironment().NEXT_PUBLIC_APP_URL;
  if (!publicIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/platform-admin/", "/onboarding/", "/select-organization", "/auth/", "/login", "/signup", "/invite", "/api/"] }, sitemap: `${base}/sitemap.xml` };
}
