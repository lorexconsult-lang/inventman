import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InventmanLogo } from "@/components/brand/inventman-logo";
import { requirePlatformAdmin } from "@/features/subscriptions/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function PlatformAdminLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  return <div className="platform-shell min-h-dvh"><header className="sticky top-0 z-20 border-b border-line bg-[#111d29]/95 px-4 py-4 backdrop-blur sm:px-6"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><InventmanLogo variant="dark" decorative className="w-36" sizes="144px"/><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Internal</p><h1 className="mt-1 text-lg font-semibold">Platform Administration</h1></div></div><nav aria-label="Platform administration" className="flex max-w-full gap-1 overflow-x-auto text-sm"><AdminLink href="/platform-admin">Overview</AdminLink><AdminLink href="/platform-admin/tenants">Tenants</AdminLink><AdminLink href="/platform-admin/plans">Plans</AdminLink><AdminLink href="/platform-admin/audit">Audit</AdminLink><AdminLink href="/dashboard">Tenant workspace</AdminLink></nav></div></header><main className="app-main mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">{children}</main></div>;
}
function AdminLink({ href, children }: { href: string; children: ReactNode }) { return <Link href={href} className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-subtle hover:bg-white/10 hover:text-white">{children}</Link>; }
