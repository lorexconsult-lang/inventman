import Link from "next/link";
import { Building2, CircleAlert, PackageSearch, Warehouse } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrganizationContext } from "@/features/organizations/context";
import { FirstRunChecklist } from "@/features/onboarding/first-run-checklist";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { client, organization } = await getOrganizationContext();
  const { data: onboarding } = await client
    .from("organization_onboarding")
    .select("completed_at")
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (onboarding && !onboarding.completed_at) redirect("/onboarding/setup");
  const [{ count: products }, { count: branches }, { count: warehouses }] =
    await Promise.all([
      client
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .neq("status", "ARCHIVED"),
      client
        .from("branches")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "active"),
      client
        .from("warehouses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "active"),
    ]);
  const metrics = [
    {
      label: "Catalogue products",
      value: String(products ?? 0),
      icon: PackageSearch,
    },
    { label: "Active branches", value: String(branches ?? 0), icon: Building2 },
    {
      label: "Active warehouses",
      value: String(warehouses ?? 0),
      icon: Warehouse,
    },
  ];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operations overview" title="Run your business operations." description="Manage locations, catalogue, inventory, procurement and sales from one secure workspace." />
      <section aria-label="Key metrics" className="grid gap-4 lg:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <MetricCard key={label} label={label} value={value} icon={<Icon className="size-4" />} />
        ))}
      </section>
      <FirstRunChecklist />
      <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["Add a product", "/dashboard/catalogue/new"], ["Review inventory", "/dashboard/inventory"], ["Create a purchase order", "/dashboard/procurement/purchase-orders"], ["Open point of sale", "/dashboard/pos"]].map(([label, href]) => <Link key={href} href={href} className="app-surface flex min-h-16 items-center justify-between px-4 text-sm font-semibold hover:-translate-y-0.5 hover:border-accent"><span>{label}</span><span aria-hidden="true" className="text-accent">→</span></Link>)}
      </section>
      <section className="rounded-2xl border bg-surface">
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:items-center">
          <div>
            <h2 className="font-semibold">Attention required</h2>
            <p className="mt-1 text-sm text-subtle">
              Catalogue and location exceptions will appear here.
            </p>
          </div>
          <StatusBadge tone="positive">All clear</StatusBadge>
        </div>
        <div className="grid min-h-56 place-items-center p-8 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
              <CircleAlert className="size-5 text-subtle" />
            </span>
            <p className="mt-4 font-medium">No configuration exceptions</p>
          </div>
        </div>
      </section>
    </div>
  );
}
