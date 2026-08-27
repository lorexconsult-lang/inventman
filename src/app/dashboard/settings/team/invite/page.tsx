import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { inviteMember } from "@/features/team/actions";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { client, organization } =
    await requireOrganizationPermission("team.invite");
  const [{ data: roles }, { data: branches }] = await Promise.all([
    client
      .from("roles")
      .select("id,name,description")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .not("name", "eq", "Owner")
      .order("name"),
    client
      .from("branches")
      .select("id,name,code")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .order("name"),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Invite team member"
        description="The invitation expires after seven days and can only be accepted once."
      />
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-warning-soft p-3 text-warning"
        >
          {error}
        </p>
      )}
      <form
        action={inviteMember}
        className="mt-6 max-w-3xl space-y-5 rounded-xl border bg-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" required />
          <Field label="Display name (optional)" name="displayName" />
          <label className="text-sm font-medium sm:col-span-2">
            Role
            <select
              required
              name="roleId"
              className="mt-2 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select a role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="font-medium">Branch access</legend>
          <p className="mt-1 text-sm text-subtle">
            Leave every branch unchecked to grant access to all branches allowed
            by the role.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {branches?.map((branch) => (
              <label key={branch.id} className="rounded-lg border p-3 text-sm">
                <input
                  className="mr-2"
                  type="checkbox"
                  name="branchId"
                  value={branch.id}
                />
                {branch.name} ({branch.code})
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Invitation note (optional)
          <textarea
            name="note"
            rows={3}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">
          Send invitation
        </button>
      </form>
    </>
  );
}
function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...input } = props;
  return (
    <label className="text-sm font-medium">
      {label}
      <input {...input} className="mt-2 w-full rounded-lg border px-3 py-2" />
    </label>
  );
}
