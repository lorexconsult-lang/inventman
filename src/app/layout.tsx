import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { appConfig } from "@/config/app";
import { publicIndexingEnabled } from "@/lib/marketing/seo";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: appConfig.name, template: `%s | ${appConfig.name}` },
  description: appConfig.description,
  manifest: "/manifest.webmanifest",
  applicationName: appConfig.name,
  appleWebApp: { capable: true, statusBarStyle: "default", title: appConfig.name },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
  robots: { index: publicIndexingEnabled(), follow: publicIndexingEnabled() },
  openGraph: { type: "website", siteName: appConfig.name, title: appConfig.name, description: appConfig.description },
  twitter: { card: "summary_large_image", title: appConfig.name, description: appConfig.description },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#183f35" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geist.variable} ${geistMono.variable}`}><body className="antialiased">{children}</body></html>;
}
