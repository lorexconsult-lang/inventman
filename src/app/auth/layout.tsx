import type { Metadata } from "next";
import Link from "next/link";
import { InventmanLogo } from "@/components/brand/inventman-logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-route-shell">
      <header className="auth-brand-header">
        <Link href="/" aria-label="Inventman home">
          <InventmanLogo
            variant="primary"
            decorative
            eager
            className="w-56"
            sizes="224px"
          />
        </Link>
      </header>
      {children}
    </div>
  );
}
