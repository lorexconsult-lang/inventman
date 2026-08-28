import Link from "next/link";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav
        aria-label="Administration settings"
        className="mb-6 flex gap-2 overflow-x-auto border-b pb-3"
      >
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/settings"
        >
          Organization
        </Link>
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/settings/team"
        >
          Team
        </Link>
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/settings/roles"
        >
          Roles & permissions
        </Link>
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/catalogue/settings"
        >
          Catalogue
        </Link>
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/inventory/settings"
        >
          Inventory
        </Link>
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/settings/payments"
        >
          Payments
        </Link>
        <Link
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-muted"
          href="/dashboard/settings/offline"
        >
          Offline & Sync
        </Link>
      </nav>
      {children}
    </div>
  );
}
