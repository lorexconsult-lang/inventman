import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Users, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { setBranchStatus } from "@/features/locations/actions";
import { BranchForm } from "@/features/locations/components/branch-form";
import { WarehouseForm } from "@/features/locations/components/warehouse-form";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  const { client, organization } = await getOrganizationContext();
  const [{ data: branch }, { data: warehouses }, { data: access }] =
    await Promise.all([
      client
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .eq("organization_id", organization.id)
        .maybeSingle(),
      client
        .from("warehouses")
        .select("id,name,code,warehouse_type,status,is_default")
        .eq("branch_id", branchId)
        .order("name"),
      client
        .from("member_branch_access")
        .select("membership_id")
        .eq("branch_id", branchId),
    ]);
  if (!branch) notFound();
  const nextStatus = branch.status === "active" ? "inactive" : "active";
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations / Branches"
        title={branch.name}
        description={`${branch.code} · ${branch.city ?? "Location not set"} · ${branch.timezone}`}
        actions={
          <>
            <StatusBadge
              tone={branch.status === "active" ? "positive" : "neutral"}
            >
              {branch.status}
            </StatusBadge>
            <form action={setBranchStatus.bind(null, branch.id, nextStatus)}>
              <Button variant="secondary">
                {nextStatus === "inactive" ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary icon={<Building2 />} label="Branch code" value={branch.code} />
        <Summary
          icon={<Warehouse />}
          label="Warehouses"
          value={String(warehouses?.length ?? 0)}
        />
        <Summary
          icon={<Users />}
          label="Scoped staff"
          value={String(access?.length ?? 0)}
        />
      </div>
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Branch details</h2>
        <div className="mt-6">
          <BranchForm branch={branch} defaultTimezone={organization.timezone} />
        </div>
      </section>
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Warehouses</h2>
            <p className="mt-1 text-sm text-subtle">
              Each warehouse receives a root stock location automatically.
            </p>
          </div>
          <Link
            href="/dashboard/warehouses"
            className="text-sm font-semibold text-accent"
          >
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {warehouses?.map((warehouse) => (
            <Link
              key={warehouse.id}
              href={`/dashboard/warehouses/${warehouse.id}`}
              className="rounded-xl border p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{warehouse.name}</p>
                  <p className="mt-1 text-xs text-subtle">
                    {warehouse.code} ·{" "}
                    {warehouse.warehouse_type.replaceAll("_", " ")}
                  </p>
                </div>
                {warehouse.is_default && (
                  <StatusBadge tone="positive">Default</StatusBadge>
                )}
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-7 border-t pt-7">
          <h3 className="font-semibold">Add warehouse</h3>
          <div className="mt-5">
            <WarehouseForm branchId={branch.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
function Summary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-surface p-5">
      <span className="text-subtle">{icon}</span>
      <p className="mt-5 text-sm text-subtle">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
