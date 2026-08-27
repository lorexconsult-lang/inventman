import { PageHeader } from "@/components/ui/page-header";
import { PermissionEditor } from "@/features/team/components/permission-editor";
import { createRole } from "@/features/team/actions";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function NewRolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; duplicate?: string }>;
}) {
  const { error, duplicate } = await searchParams;
  const { client, organization } =
    await requireOrganizationPermission("roles.manage");
  const [{ data: permissions }, { data: sourceRole }] = await Promise.all([
    client.from("permissions").select("id,code,description").order("code"),
    duplicate
      ? client
          .from("roles")
          .select("name,description,role_permissions(permission_id)")
          .eq("organization_id", organization.id)
          .eq("id", duplicate)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Create role"
        description="Choose only the capabilities this role needs."
      />
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-warning-soft p-3 text-warning"
        >
          {error}
        </p>
      )}
      <form action={createRole} className="mt-6 space-y-5">
        <div className="grid gap-4 rounded-xl border bg-surface p-5 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Role name
            <input
              required
              name="name"
              defaultValue={sourceRole ? `${sourceRole.name} copy` : ""}
              className="mt-2 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            Description
            <input
              name="description"
              defaultValue={sourceRole?.description ?? ""}
              className="mt-2 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>
        <PermissionEditor
          permissions={permissions ?? []}
          selected={
            sourceRole?.role_permissions.map((item) => item.permission_id) ?? []
          }
        />
        <p className="rounded-lg bg-muted p-3 text-sm text-subtle">
          Permission dependencies are not granted silently. Add the matching
          view capabilities when a workflow capability needs them.
        </p>
        <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">
          Create role
        </button>
      </form>
    </>
  );
}
