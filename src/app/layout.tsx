import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { appConfig } from "@/config/app";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: appConfig.name, template: `%s · ${appConfig.name}` },
  description: appConfig.description,
  manifest: "/manifest.webmanifest",
  applicationName: appConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appConfig.name,
  },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
  openGraph: { type: "website", siteName: appConfig.name, title: appConfig.name, description: appConfig.description },
  twitter: { card: "summary", title: appConfig.name, description: appConfig.description },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#24483b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
