import type { Metadata } from "next";
import { getPublicEnvironment } from "@/lib/env/public";

export const productCategory =
  "Business inventory, sales and profitability operating system";

export function publicIndexingEnabled(values: Record<string, string | undefined> = process.env) {
  return values.APP_ENV === "production";
}

export function absoluteUrl(path = "/") {
  return new URL(path, getPublicEnvironment().NEXT_PUBLIC_APP_URL).toString();
}

export function publicMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    robots: {
      index: publicIndexingEnabled(),
      follow: publicIndexingEnabled(),
    },
    openGraph: {
      type: "website",
      siteName: "Inventman",
      title,
      description,
      url: path,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
