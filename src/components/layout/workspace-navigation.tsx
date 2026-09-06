"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
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
  Menu,
  X,
} from "lucide-react";
import { InventmanLogo } from "@/components/brand/inventman-logo";

const groups = [
  {
    label: "Main",
    items: [
      {
        label: "POS",
        href: "/dashboard/pos",
        icon: ScanLine,
        capabilities: ["pos.access"],
        feature: "pos",
      },
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        capabilities: [],
        feature: null,
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
        feature: "core.catalogue",
      },
      {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: Boxes,
        capabilities: ["inventory.view", "inventory.movement_view"],
        feature: "core.inventory",
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
        feature: "procurement",
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
        feature: "sales",
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
        feature: "payments",
      },
      {
        label: "Finance",
        href: "/dashboard/finance",
        icon: Landmark,
        capabilities: ["finance.view"],
        feature: "finance",
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
        feature: null,
      },
      {
        label: "Warehouses",
        href: "/dashboard/warehouses",
        icon: Warehouse,
        capabilities: ["warehouses.view", "warehouses.manage"],
        feature: "core.inventory",
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
        feature: null,
      },
      {
        label: "Roles & permissions",
        href: "/dashboard/settings/roles",
        icon: UserCog,
        capabilities: ["roles.view", "roles.manage"],
        feature: null,
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
        feature: null,
      },
    ],
  },
] as const;

export function WorkspaceNavigation({
  permissions,
  features,
  mode,
}: {
  permissions: string[];
  features: string[];
  mode: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const allowed = new Set(permissions);
  const entitled = new Set(features);
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.feature || entitled.has(item.feature)) &&
          (!item.capabilities.length || item.capabilities.some((code) => allowed.has(code))),
      ),
    }))
    .filter((group) => group.items.length);
  if (mode === "mobile")
    return (
      <>
        <nav aria-label="Mobile navigation" className="mobile-nav-trigger fixed left-3 top-3 z-40 md:hidden">
          <button aria-controls="mobile-workspace-navigation" aria-expanded={open} aria-label="Open navigation" className="grid size-10 place-items-center rounded-lg border border-line bg-surface shadow-sm" onClick={() => setOpen(true)} type="button">
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </nav>
        {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setOpen(false)} type="button" />}
        <aside id="mobile-workspace-navigation" aria-hidden={!open} className={`mobile-nav-drawer app-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col overflow-y-auto shadow-2xl transition-transform duration-200 md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-4">
            <Link aria-label="Inventman dashboard" className="flex items-center" href="/dashboard"><InventmanLogo variant="dark" decorative eager className="w-36" sizes="144px" /></Link>
            <button aria-label="Close navigation" className="grid size-10 place-items-center rounded-lg text-white hover:bg-white/10" onClick={() => setOpen(false)} type="button"><X aria-hidden="true" className="size-5" /></button>
          </div>
          <NavigationGroups onNavigate={() => setOpen(false)} pathname={pathname} visible={visible} />
        </aside>
      </>
    );
  return (
    <div className="hidden flex-1 md:block"><NavigationGroups pathname={pathname} visible={visible} /></div>
  );
}

function NavigationGroups({ pathname, visible, onNavigate }: { pathname: string; visible: Array<{ label: string; items: Array<{ label: string; href: string; icon: LucideIcon }> }>; onNavigate?: () => void }) {
  return <nav aria-label="Primary navigation" className="space-y-5 p-3 py-5">
        {visible.map((group) => (
          <div key={group.label}>
            <p className="app-sidebar-muted mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className="app-sidebar-link flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#c5d2cb]"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>;
}

function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
