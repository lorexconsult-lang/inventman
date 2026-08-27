import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  getEffectivePermissions,
  requireOrganizationPermission,
} from "@/features/organizations/context";

export default async function RolesPage() {
  const { client, organization } =
    await requireOrganizationPermission("roles.view");
  const current = await getEffectivePermissions(organization.id);
  const { data: roles } = await client
    .from("roles")
    .select(
      "id,name,description,is_system,is_active,role_permissions(count),member_roles(count)",
    )
    .eq("organization_id", organization.id)
    .order("is_system", { ascending: false })
    .order("name");
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Roles & permissions"
        description="Capabilities define what staff can do; branch access defines where."
        actions={
          current.has("roles.manage") ? (
            <Link
              href="/dashboard/settings/roles/new"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Create role
            </Link>
          ) : undefined
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {roles?.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border bg-surface p-5 hover:border-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{role.name}</h2>
                <p className="mt-1 text-sm text-subtle">
                  {role.description || "No description"}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs">
                {role.is_system ? "System" : "Custom"}
              </span>
            </div>
            <p className="mt-4 text-sm text-subtle">
              {role.role_permissions[0]?.count ?? 0} permissions ·{" "}
              {role.member_roles[0]?.count ?? 0} assignments ·{" "}
              {role.is_active ? "Active" : "Inactive"}
            </p>
            <div className="mt-4 flex gap-3 text-sm font-semibold">
              <Link
                className="text-accent"
                href={`/dashboard/settings/roles/${role.id}`}
              >
                View role
              </Link>
              {current.has("roles.manage") && (
                <Link
                  className="text-accent"
                  href={`/dashboard/settings/roles/new?duplicate=${role.id}`}
                >
                  Duplicate
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
