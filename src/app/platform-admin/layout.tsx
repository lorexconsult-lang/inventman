import Link from "next/link";
import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/features/subscriptions/queries";

export const dynamic = "force-dynamic";
export default async function PlatformAdminLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  return <div className="min-h-dvh bg-[#101b2d] text-white"><header className="border-b border-white/15 bg-[#0b1423] px-6 py-5"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7dd3fc]">Inventman</p><h1 className="mt-1 text-lg font-semibold">Platform Administration</h1></div><nav className="flex flex-wrap gap-2 text-sm"><AdminLink href="/platform-admin">Overview</AdminLink><AdminLink href="/platform-admin/tenants">Tenants</AdminLink><AdminLink href="/platform-admin/plans">Plans</AdminLink><AdminLink href="/platform-admin/audit">Audit</AdminLink><AdminLink href="/dashboard">Tenant workspace</AdminLink></nav></div></header><main className="mx-auto max-w-[1500px] p-6 lg:p-10">{children}</main></div>;
}
function AdminLink({ href, children }: { href: string; children: ReactNode }) { return <Link href={href} className="rounded-lg border border-white/15 px-3 py-2 hover:bg-white/10">{children}</Link>; }
