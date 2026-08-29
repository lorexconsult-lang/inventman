"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  catalogue: "Catalogue",
  inventory: "Inventory",
  procurement: "Procurement",
  sales: "Sales",
  payments: "Payments",
  finance: "Finance",
  pos: "Point of sale",
  branches: "Branches",
  warehouses: "Warehouses",
  settings: "Settings",
  team: "Team",
  roles: "Roles & permissions",
  billing: "Billing",
  products: "Products",
  categories: "Categories",
  suppliers: "Suppliers",
  customers: "Customers",
  reports: "Reports",
  transfers: "Transfers",
  adjustments: "Adjustments",
  counts: "Stock counts",
  orders: "Orders",
  quotations: "Quotations",
};

export function WorkspaceBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = parts.map((part, index) => ({
    href: `/dashboard/${parts.slice(0, index + 1).join("/")}`,
    label: labels[part] ?? (isIdentifier(part) ? "Details" : titleCase(part)),
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-xs text-subtle">
        <li><Link className="font-medium hover:text-ink" href="/dashboard">Workspace</Link></li>
        {crumbs.map((crumb, index) => (
          <li className="flex min-w-0 items-center gap-1" key={crumb.href}>
            <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
            {index === crumbs.length - 1 ? (
              <span aria-current="page" className="truncate font-semibold text-ink">{crumb.label}</span>
            ) : (
              <Link className="truncate font-medium hover:text-ink" href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function isIdentifier(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(value) || /^\d+$/.test(value);
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
