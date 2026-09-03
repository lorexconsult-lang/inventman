import { PageHeader } from "@/components/ui/page-header";
import type { Metadata } from "next";
import { getAvailableOrganizations } from "@/features/organizations/context";
import { switchOrganization } from "@/features/organizations/actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SelectOrganizationPage() {
  const organizations = await getAvailableOrganizations();
  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-10">
      <PageHeader
        eyebrow="Workspace"
        title="Choose a workspace"
        description="Select the organization you want to work in."
      />
      <div className="mt-6 space-y-3">
        {organizations.map((organization) => (
          <form
            key={organization.id}
            action={switchOrganization}
            className="rounded-xl border bg-surface p-5"
          >
            <input
              type="hidden"
              name="organizationId"
              value={organization.id}
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{organization.name}</p>
                <p className="text-sm text-subtle">{organization.status}</p>
              </div>
              <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
                Open workspace
              </button>
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
