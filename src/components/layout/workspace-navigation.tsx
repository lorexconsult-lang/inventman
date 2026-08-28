"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Boxes,
  Building2,
  LayoutDashboard,
  PackageSearch,
  ScanLine,
  Settings2,
  ShoppingCart,
  WalletCards,
  Landmark,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";

const groups = [
  {
    label: "Main",
    items: [
      {
        label: "POS",
        href: "/dashboard/pos",
        icon: ScanLine,
        capabilities: ["pos.access"],
      },
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        capabilities: [],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Catalogue",
        href: "/dashboard/catalogue",
        icon: PackageSearch,
        capabilities: ["products.view"],
      },
      {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: Boxes,
        capabilities: ["inventory.view", "inventory.movement_view"],
      },
      {
        label: "Procurement",
        href: "/dashboard/procurement",
        icon: ShoppingCart,
        capabilities: [
          "suppliers.view",
          "procurement.requisition_view",
          "procurement.order_view",
        ],
      },
      {
        label: "Sales",
        href: "/dashboard/sales",
        icon: BadgeDollarSign,
        capabilities: [
          "customers.view",
          "sales.order_view",
          "sales.quotation_view",
        ],
      },
      {
        label: "Payments",
        href: "/dashboard/payments",
        icon: WalletCards,
        capabilities: [
          "payments.customer.view",
          "payments.supplier.view",
          "payments.reports.view",
        ],
      },
      {
        label: "Finance",
        href: "/dashboard/finance",
        icon: Landmark,
        capabilities: ["finance.view"],
      },
    ],
  },
  {
    label: "Business setup",
    items: [
      {
        label: "Branches",
        href: "/dashboard/branches",
        icon: Building2,
        capabilities: ["branches.view", "branches.manage"],
      },
      {
        label: "Warehouses",
        href: "/dashboard/warehouses",
        icon: Warehouse,
        capabilities: ["warehouses.view", "warehouses.manage"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Team",
        href: "/dashboard/settings/team",
        icon: Users,
        capabilities: ["team.view"],
      },
      {
        label: "Roles & permissions",
        href: "/dashboard/settings/roles",
        icon: UserCog,
        capabilities: ["roles.view", "roles.manage"],
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings2,
        capabilities: [
          "organizations.manage",
          "prices.manage",
          "inventory.settings_manage",
        ],
      },
    ],
  },
] as const;

export function WorkspaceNavigation({
  permissions,
  mode,
}: {
  permissions: string[];
  mode: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const allowed = new Set(permissions);
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.capabilities.length ||
          item.capabilities.some((code) => allowed.has(code)),
      ),
    }))
    .filter((group) => group.items.length);
  if (mode === "mobile")
    return (
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t bg-canvas/95 p-2 backdrop-blur md:hidden"
      >
        {visible
          .flatMap((group) => group.items)
          .map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={`flex min-w-20 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] text-subtle ${isActive(pathname, href) ? "bg-accent-soft text-accent" : ""}`}
            >
              <Icon className="size-4" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          ))}
      </nav>
    );
  return (
    <aside className="hidden min-h-[calc(100dvh-4rem)] border-r border-line p-4 md:block">
      <nav aria-label="Primary navigation" className="space-y-5">
        {visible.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-subtle">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-subtle hover:bg-muted hover:text-ink ${isActive(pathname, href) ? "bg-accent-soft text-accent" : ""}`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
