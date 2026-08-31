import Link from "next/link";
import { Warehouse } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function WarehousesPage() {
  const { client, organization } = await getOrganizationContext();
  const { data } = await client
    .from("warehouses")
    .select(
      "id,name,code,warehouse_type,status,is_default,branches!warehouses_branch_fk(name)",
    )
    .eq("organization_id", organization.id)
    .order("name");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Warehouses"
        description="Control store areas and their hierarchical zones, aisles, racks, shelves, and bins."
      />
      {!data?.length ? (
        <EmptyState
          icon={<Warehouse className="size-5" />}
          title="No warehouses"
          description="Open a branch to create its first warehouse."
          action={
            <Link
              href="/dashboard/branches"
              className="font-semibold text-accent"
            >
              Go to branches
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-surface">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-4 border-b bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-subtle md:grid">
            <span>Warehouse</span>
            <span>Branch</span>
            <span>Type</span>
            <span>Status</span>
          </div>
          {data.map((warehouse) => (
            <Link
              key={warehouse.id}
              href={`/dashboard/warehouses/${warehouse.id}`}
              className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
            >
              <div>
                <p className="font-semibold">{warehouse.name}</p>
                <p className="text-xs text-subtle">
                  {warehouse.code}
                  {warehouse.is_default ? " · Default" : ""}
                </p>
              </div>
              <p className="text-sm">{warehouse.branches?.name}</p>
              <p className="text-sm text-subtle">
                {warehouse.warehouse_type.replaceAll("_", " ")}
              </p>
              <StatusBadge
                tone={warehouse.status === "active" ? "positive" : "neutral"}
              >
                {warehouse.status}
              </StatusBadge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
