import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Dashboard", "/dashboard/sales"],
  ["Customers", "/dashboard/sales/customers"],
  ["Quotations", "/dashboard/sales/quotations"],
  ["Sales Orders", "/dashboard/sales/orders"],
  ["Fulfilments", "/dashboard/sales/fulfilments"],
  ["Invoices", "/dashboard/sales/invoices"],
  ["Receivables", "/dashboard/sales/receivables"],
  ["Returns", "/dashboard/sales/returns"],
  ["Credit Notes", "/dashboard/sales/credit-notes"],
  ["Reports", "/dashboard/sales/reports"],
] as const;

export default function SalesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Sales navigation"
        className="flex gap-2 overflow-x-auto rounded-xl border bg-surface p-2"
      >
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-subtle hover:bg-muted hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
