import { Building2, CircleAlert, PackageSearch, Warehouse } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function DashboardPage() {
  const { client, organization } = await getOrganizationContext();
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
      <div>
        <p className="mb-2 text-sm font-semibold text-accent">
          Operations overview
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Run your business operations.
        </h1>
        <p className="mt-3 max-w-2xl text-subtle">
          Manage locations, catalogue, inventory, procurement, and Sales from
          one tenant-secure workspace.
        </p>
      </div>
      <section aria-label="Key metrics" className="grid gap-4 lg:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-subtle">{label}</p>
              <Icon className="size-4 text-subtle" />
            </div>
            <p className="mt-8 text-3xl font-semibold">{value}</p>
          </article>
        ))}
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
