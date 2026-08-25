import { Boxes, CircleAlert, PackageCheck, ReceiptText } from "lucide-react";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

const metrics = [
  { label: "Revenue today", value: "—", icon: ReceiptText },
  { label: "Inventory value", value: "—", icon: Boxes },
  { label: "Products in stock", value: "—", icon: PackageCheck }
];

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const client = await createClient();
  const { data } = await client.from("organization_members").select("organization_id").eq("user_id", user.id).eq("status", "active").limit(1);
  if (!data?.length) redirect("/onboarding");
  return <div className="space-y-8"><div><p className="mb-2 text-sm font-semibold text-accent">Operations overview</p><h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Know what needs attention.</h1><p className="mt-3 max-w-2xl text-subtle">Your organization foundation is active. Operational metrics will remain empty until later product modules are authorized.</p></div><section aria-label="Key metrics" className="grid gap-4 lg:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-sm font-medium text-subtle">{label}</p><Icon className="size-4 text-subtle" aria-hidden="true" /></div><p className="mt-8 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-subtle">Awaiting operational data</p></article>)}</section><section className="rounded-2xl border bg-surface"><div className="flex items-start justify-between gap-4 border-b p-5 sm:items-center"><div><h2 className="font-semibold">Attention required</h2><p className="mt-1 text-sm text-subtle">Operational exceptions will appear here.</p></div><StatusBadge tone="positive">All clear</StatusBadge></div><div className="grid min-h-56 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-muted"><CircleAlert className="size-5 text-subtle" aria-hidden="true" /></span><p className="mt-4 font-medium">No operational data yet</p></div></div></section></div>;
}
