import type { Metadata } from "next";
import Link from "next/link";
import { InventmanLogo } from "@/components/brand/inventman-logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="onboarding-brand-shell">
      <header className="onboarding-brand-header">
        <Link href="/" aria-label="Inventman home">
          <InventmanLogo
            variant="compact"
            decorative
            eager
            className="w-48"
            sizes="192px"
          />
        </Link>
      </header>
      {children}
    </div>
  );
}
