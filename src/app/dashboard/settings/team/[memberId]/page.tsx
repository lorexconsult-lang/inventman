import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import {
  getEffectivePermissions,
  requireOrganizationPermission,
} from "@/features/organizations/context";
import {
  assignRoles,
  setMemberStatus,
  updateBranchAccess,
} from "@/features/team/actions";
import { groupPermissions } from "@/features/team/permission-utils";

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ memberId }, { error }] = await Promise.all([params, searchParams]);
  const { client, organization, user } =
    await requireOrganizationPermission("team.view");
  const current = await getEffectivePermissions(organization.id);
  const [
    { data: member },
    { data: roles },
    { data: branches },
    { data: events },
  ] = await Promise.all([
    client
      .from("organization_members")
      .select(
        "id,user_id,display_name,email,status,joined_at,created_at,suspended_at,suspension_reason,member_roles(role_id,roles(name,role_permissions(permissions(code,description)))),member_branch_access(branch_id,branches(name))",
      )
      .eq("organization_id", organization.id)
      .eq("id", memberId)
      .single(),
    client
      .from("roles")
      .select("id,name,is_system,is_active")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("branches")
      .select("id,name,code")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .order("name"),
    client
      .from("audit_events")
      .select("id,action,after_data,created_at")
      .eq("organization_id", organization.id)
      .eq("entity_type", "organization_member")
      .eq("entity_id", memberId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (!member) notFound();
  const selectedRoles = new Set(member.member_roles.map((x) => x.role_id));
  const selectedBranches = new Set(
    member.member_branch_access.map((x) => x.branch_id),
  );
  const effective = [
    ...new Map(
      member.member_roles
        .flatMap((x) => x.roles?.role_permissions ?? [])
        .flatMap((x) =>
          x.permissions ? [[x.permissions.code, x.permissions] as const] : [],
        ),
    ).values(),
  ];
  const self = member.user_id === user.id;
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title={member.display_name || member.email || "Team member"}
        description={member.email || "Organization staff access"}
      />
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-warning-soft p-3 text-warning"
        >
          {error}
        </p>
      )}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border bg-surface p-5">
          <h2 className="font-semibold">Overview</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Status" value={member.status.toUpperCase()} />
            <Row
              label="Joined"
              value={
                member.joined_at
                  ? new Date(member.joined_at).toLocaleString()
                  : "Not joined"
              }
            />
            <Row
              label="Suspended"
              value={
                member.suspended_at
                  ? new Date(member.suspended_at).toLocaleString()
                  : "No"
              }
            />
            <Row label="Reason" value={member.suspension_reason || "—"} />
          </dl>
        </section>
        <section className="rounded-xl border bg-surface p-5 lg:col-span-2">
          <h2 className="font-semibold">Effective permissions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(groupPermissions(effective)).map(
              ([domain, items]) => (
                <div key={domain} className="rounded-lg border p-3">
                  <p className="font-medium capitalize">{domain}</p>
                  {items.map((item) => (
                    <p key={item.code} className="mt-1 text-xs text-subtle">
                      ✓ {item.description}
                    </p>
                  ))}
                </div>
              ),
            )}
          </div>
        </section>
      </div>
      {current.has("team.update") && !self && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form
            action={assignRoles.bind(null, memberId)}
            className="rounded-xl border bg-surface p-5"
          >
            <h2 className="font-semibold">Assigned roles</h2>
            <div className="mt-3 space-y-2">
              {roles
                ?.filter(
                  (r) =>
                    !(r.is_system && r.name === "Owner") ||
                    selectedRoles.has(r.id),
                )
                .map((role) => (
                  <label
                    key={role.id}
                    className="block rounded-lg border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="roleId"
                      value={role.id}
                      defaultChecked={selectedRoles.has(role.id)}
                      className="mr-2"
                      disabled={role.is_system && role.name === "Owner"}
                    />
                    {role.name}
                  </label>
                ))}
            </div>
            <button className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
              Save roles
            </button>
          </form>
          <form
            action={updateBranchAccess.bind(null, memberId)}
            className="rounded-xl border bg-surface p-5"
          >
            <h2 className="font-semibold">Branch access</h2>
            <label className="mt-3 block rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                name="allBranches"
                defaultChecked={!selectedBranches.size}
                className="mr-2"
              />
              All branches
            </label>
            <div className="mt-2 space-y-2">
              {branches?.map((branch) => (
                <label
                  key={branch.id}
                  className="block rounded-lg border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="branchId"
                    value={branch.id}
                    defaultChecked={selectedBranches.has(branch.id)}
                    className="mr-2"
                  />
                  {branch.name} ({branch.code})
                </label>
              ))}
            </div>
            <button className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
              Save branch access
            </button>
          </form>
        </div>
      )}
      {current.has("team.suspend") && !self && (
        <section className="mt-6 rounded-xl border bg-surface p-5">
          <h2 className="font-semibold">Membership security</h2>
          {member.status === "active" ? (
            <div className="mt-3 flex flex-wrap gap-3">
              <form action={setMemberStatus.bind(null, memberId, "suspended")}>
                <input
                  required
                  name="reason"
                  placeholder="Suspension reason"
                  className="rounded-lg border px-3 py-2"
                />
                <button className="ml-2 rounded-lg border border-warning px-4 py-2 text-warning">
                  Suspend
                </button>
              </form>
              <form
                action={setMemberStatus.bind(null, memberId, "deactivated")}
              >
                <button className="rounded-lg border border-danger px-4 py-2 text-danger">
                  Deactivate
                </button>
              </form>
            </div>
          ) : (
            <form
              className="mt-3"
              action={setMemberStatus.bind(null, memberId, "active")}
            >
              <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">
                Restore access
              </button>
            </form>
          )}
        </section>
      )}
      <section className="mt-6 rounded-xl border bg-surface p-5">
        <h2 className="font-semibold">Administrative activity</h2>
        <div className="mt-3 space-y-3">
          {events?.map((event) => (
            <div key={event.id} className="border-b pb-3 text-sm last:border-0">
              <p className="font-medium">{event.action.replaceAll(".", " ")}</p>
              <p className="text-xs text-subtle">
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {!events?.length && (
            <p className="text-sm text-subtle">
              No access changes recorded yet.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-subtle">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
