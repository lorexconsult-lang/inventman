import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { setWarehouseStatus } from "@/features/locations/actions";
import { LocationTree } from "@/features/locations/components/location-tree";
import { StorageLocationForm } from "@/features/locations/components/storage-location-form";
import { WarehouseForm } from "@/features/locations/components/warehouse-form";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function WarehouseDetailPage({
  params,
}: {
  params: Promise<{ warehouseId: string }>;
}) {
  const { warehouseId } = await params;
  const { client, organization } = await getOrganizationContext();
  const [{ data: warehouse }, { data: locations }] = await Promise.all([
    client
      .from("warehouses")
      .select("*,branches(name)")
      .eq("id", warehouseId)
      .eq("organization_id", organization.id)
      .maybeSingle(),
    client
      .from("storage_locations")
      .select("id,parent_location_id,name,code,location_type,is_active")
      .eq("warehouse_id", warehouseId)
      .order("created_at"),
  ]);
  if (!warehouse) notFound();
  const next = warehouse.status === "active" ? "inactive" : "active";
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Operations / ${warehouse.branches?.name ?? "Branch"}`}
        title={warehouse.name}
        description={`${warehouse.code} · ${warehouse.warehouse_type.replaceAll("_", " ")}`}
        actions={
          <>
            <StatusBadge
              tone={warehouse.status === "active" ? "positive" : "neutral"}
            >
              {warehouse.status}
            </StatusBadge>
            <form action={setWarehouseStatus.bind(null, warehouse.id, next)}>
              <Button variant="secondary">
                {next === "inactive" ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </>
        }
      />
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Warehouse details</h2>
        <div className="mt-6">
          <WarehouseForm branchId={warehouse.branch_id} warehouse={warehouse} />
        </div>
      </section>
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Storage hierarchy</h2>
        <p className="mt-1 text-sm text-subtle">
          The root is created automatically. Add precise physical locations
          beneath it.
        </p>
        <div className="mt-6">
          <LocationTree locations={locations ?? []} />
        </div>
      </section>
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Add storage location</h2>
        <div className="mt-6">
          <StorageLocationForm
            branchId={warehouse.branch_id}
            warehouseId={warehouse.id}
            locations={(locations ?? []).map(({ id, name, code }) => ({
              id,
              name,
              code,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
