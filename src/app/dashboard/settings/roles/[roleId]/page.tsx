import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionEditor } from "@/features/team/components/permission-editor";
import { updateRole } from "@/features/team/actions";
import {
  getEffectivePermissions,
  requireOrganizationPermission,
} from "@/features/organizations/context";

export default async function RolePage({
  params,
  searchParams,
}: {
  params: Promise<{ roleId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ roleId }, notice] = await Promise.all([params, searchParams]);
  const { client, organization } =
    await requireOrganizationPermission("roles.view");
  const current = await getEffectivePermissions(organization.id);
  const [{ data: role }, { data: permissions }] = await Promise.all([
    client
      .from("roles")
      .select(
        "id,name,description,is_system,is_active,role_permissions(permission_id),member_roles(count)",
      )
      .eq("organization_id", organization.id)
      .eq("id", roleId)
      .single(),
    client.from("permissions").select("id,code,description").order("code"),
  ]);
  if (!role) notFound();
  const canEdit = current.has("roles.manage") && !role.is_system;
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title={role.name}
        description={`${role.is_system ? "Protected system role" : "Custom role"} · ${role.member_roles[0]?.count ?? 0} assignments`}
      />
      {(notice.error || notice.saved) && (
        <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">
          {notice.error || "Role saved."}
        </p>
      )}
      <form action={updateRole.bind(null, roleId)} className="mt-6 space-y-5">
        <fieldset disabled={!canEdit} className="space-y-5">
          <div className="grid gap-4 rounded-xl border bg-surface p-5 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Role name
              <input
                required
                name="name"
                defaultValue={role.name}
                className="mt-2 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium">
              Description
              <input
                name="description"
                defaultValue={role.description ?? ""}
                className="mt-2 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={role.is_active}
                className="mr-2"
              />
              Active
            </label>
          </div>
          <PermissionEditor
            permissions={permissions ?? []}
            selected={role.role_permissions.map((x) => x.permission_id)}
          />
          {canEdit && (
            <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">
              Save role
            </button>
          )}
        </fieldset>
      </form>
      {role.is_system && (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-subtle">
          System roles are protected from editing. Duplicate the permission
          selection into a custom role when a different access profile is
          required.
        </p>
      )}
    </>
  );
}
