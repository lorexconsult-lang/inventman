import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function BranchesPage() {
  const { client, organization } = await getOrganizationContext();
  const [{ data: branches }, { data: warehouses }] = await Promise.all([
    client
      .from("branches")
      .select("id,name,code,city,country_code,timezone,status")
      .eq("organization_id", organization.id)
      .order("name"),
    client
      .from("warehouses")
      .select("id,branch_id")
      .eq("organization_id", organization.id),
  ]);
  const counts = new Map<string, number>();
  for (const warehouse of warehouses ?? [])
    counts.set(warehouse.branch_id, (counts.get(warehouse.branch_id) ?? 0) + 1);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Branches"
        description="Manage operating sites, local settings, warehouse coverage, and branch-scoped access."
        actions={
          <Link
            href="/dashboard/branches/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-canvas"
          >
            <Plus className="size-4" />
            Add branch
          </Link>
        }
      />
      {!branches?.length ? (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="No branches yet"
          description="Create the first operating branch before adding warehouses and storage locations."
          action={
            <Link
              className="font-semibold text-accent"
              href="/dashboard/branches/new"
            >
              Create a branch
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={`/dashboard/branches/${branch.id}`}
              className="rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                    {branch.code}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{branch.name}</h2>
                </div>
                <StatusBadge
                  tone={branch.status === "active" ? "positive" : "neutral"}
                >
                  {branch.status}
                </StatusBadge>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                <div>
                  <p className="text-subtle">Location</p>
                  <p className="mt-1 font-medium">
                    {[branch.city, branch.country_code]
                      .filter(Boolean)
                      .join(", ") || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-subtle">Warehouses</p>
                  <p className="mt-1 font-medium">
                    {counts.get(branch.id) ?? 0}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
