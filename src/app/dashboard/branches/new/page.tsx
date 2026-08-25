import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { BranchForm } from "@/features/locations/components/branch-form";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function NewBranchPage() {
  const { organization } = await getOrganizationContext();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations / Branches"
        title="Add branch"
        description="Create a tenant-scoped operating site. Warehouse and staff access are configured after creation."
        actions={
          <Link
            href="/dashboard/branches"
            className="text-sm font-semibold text-accent"
          >
            Back to branches
          </Link>
        }
      />
      <section className="max-w-3xl rounded-2xl border bg-surface p-5 sm:p-7">
        <BranchForm defaultTimezone={organization.timezone} />
      </section>
    </div>
  );
}
