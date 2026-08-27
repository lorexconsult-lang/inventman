import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  requireOrganizationPermission,
  getEffectivePermissions,
} from "@/features/organizations/context";
import {
  branchAccessSummary,
  invitationState,
} from "@/features/team/permission-utils";
import { resendInvitation, revokeInvitation } from "@/features/team/actions";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filters = await searchParams;
  const { client, organization } =
    await requireOrganizationPermission("team.view");
  const permissions = await getEffectivePermissions(organization.id);
  const page = Math.max(1, Number(filters.page ?? 1));
  const size = 20;
  const [{ data: filterRoles }, { data: filterBranches }] = await Promise.all([
    client
      .from("roles")
      .select("id,name")
      .eq("organization_id", organization.id)
      .order("name"),
    client
      .from("branches")
      .select("id,name")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .order("name"),
  ]);
  let permittedMemberIds: string[] | undefined;
  if (filters.role) {
    const { data } = await client
      .from("member_roles")
      .select("membership_id")
      .eq("organization_id", organization.id)
      .eq("role_id", filters.role);
    permittedMemberIds = (data ?? []).map((item) => item.membership_id);
  }
  if (filters.branch) {
    const [{ data }, { data: allAssignments }, { data: allMembers }] =
      await Promise.all([
        client
          .from("member_branch_access")
          .select("membership_id")
          .eq("organization_id", organization.id)
          .eq("branch_id", filters.branch),
        client
          .from("member_branch_access")
          .select("membership_id")
          .eq("organization_id", organization.id),
        client
          .from("organization_members")
          .select("id")
          .eq("organization_id", organization.id),
      ]);
    const explicitlyScoped = new Set(
      (allAssignments ?? []).map((item) => item.membership_id),
    );
    const branchIds = new Set((data ?? []).map((item) => item.membership_id));
    for (const member of allMembers ?? [])
      if (!explicitlyScoped.has(member.id)) branchIds.add(member.id);
    permittedMemberIds = permittedMemberIds
      ? permittedMemberIds.filter((id) => branchIds.has(id))
      : [...branchIds];
  }
  let query = client
    .from("organization_members")
    .select(
      "id,display_name,email,status,joined_at,created_at,member_roles(roles(id,name)),member_branch_access(branches(id,name))",
      { count: "exact" },
    )
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (filters.status)
    query = query.eq(
      "status",
      filters.status as "active" | "invited" | "suspended" | "deactivated",
    );
  if (filters.q)
    query = query.or(
      `display_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`,
    );
  if (permittedMemberIds)
    query = query.in(
      "id",
      permittedMemberIds.length
        ? permittedMemberIds
        : ["00000000-0000-0000-0000-000000000000"],
    );
  const [
    { data: members, count },
    { data: invitations },
    { count: branchCount },
  ] = await Promise.all([
    query,
    client
      .from("organization_invitations")
      .select(
        "id,email,display_name,status,expires_at,last_sent_at,resend_count,roles(name),branch_ids",
      )
      .eq("organization_id", organization.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    client
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("status", "active"),
  ]);
  const memberIds = (members ?? []).map((member) => member.id);
  const { data: recentEvents } = memberIds.length
    ? await client
        .from("audit_events")
        .select("entity_id,action,created_at")
        .eq("organization_id", organization.id)
        .eq("entity_type", "organization_member")
        .in("entity_id", memberIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const lastActivity = new Map<
    string,
    { action: string; created_at: string }
  >();
  for (const event of recentEvents ?? [])
    if (!lastActivity.has(event.entity_id))
      lastActivity.set(event.entity_id, event);
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Team"
        description="Manage staff access without removing historical activity."
        actions={
          permissions.has("team.invite") ? (
            <Link
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
              href="/dashboard/settings/team/invite"
            >
              Invite team member
            </Link>
          ) : undefined
        }
      />
      {(filters.error || filters.warning) && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-warning"
        >
          {filters.error ?? filters.warning}
        </p>
      )}
      <form className="mt-5 grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-6">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Search name or email"
          className="rounded-lg border px-3 py-2 sm:col-span-2"
        />
        <select
          name="status"
          defaultValue={filters.status}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Inactive</option>
        </select>
        <select
          name="role"
          defaultValue={filters.role}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">All roles</option>
          {filterRoles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          name="branch"
          defaultValue={filters.branch}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">All branches</option>
          {filterBranches?.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <button className="rounded-lg border px-4 py-2 font-medium">
          Filter
        </button>
      </form>
      {!members?.length ? (
        <div className="mt-6">
          <EmptyState
            title="No team members found"
            description="Adjust the filters or invite a team member."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="p-3">Team member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Branch access</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Last access change</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const branchNames = member.member_branch_access.flatMap((x) =>
                  x.branches?.name ? [x.branches.name] : [],
                );
                return (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link
                        className="font-semibold text-accent"
                        href={`/dashboard/settings/team/${member.id}`}
                      >
                        {member.display_name || member.email || "Team member"}
                      </Link>
                      <span className="block text-xs text-subtle">
                        {member.email}
                      </span>
                    </td>
                    <td className="p-3">
                      {member.member_roles
                        .flatMap((x) => (x.roles?.name ? [x.roles.name] : []))
                        .join(", ") || "No role"}
                    </td>
                    <td className="p-3 uppercase">{member.status}</td>
                    <td className="p-3">
                      {branchAccessSummary(branchNames, branchCount ?? 0)}
                    </td>
                    <td className="p-3">
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      {lastActivity.has(member.id)
                        ? new Date(
                            lastActivity.get(member.id)!.created_at,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(count ?? 0) > size && (
        <div className="mt-4 flex justify-end gap-2">
          <Link
            className="rounded border px-3 py-2"
            href={`?page=${Math.max(1, page - 1)}`}
          >
            Previous
          </Link>
          <Link className="rounded border px-3 py-2" href={`?page=${page + 1}`}>
            Next
          </Link>
        </div>
      )}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Pending invitations</h2>
        <div className="mt-3 space-y-3">
          {invitations?.map((invite) => {
            const invitedBranches = (invite.branch_ids ?? []).flatMap(
              (branchId) => {
                const branch = filterBranches?.find(
                  (candidate) => candidate.id === branchId,
                );
                return branch ? [branch.name] : [];
              },
            );
            return (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface p-4"
              >
                <div>
                  <p className="font-medium">
                    {invite.display_name || invite.email}
                  </p>
                  <p className="text-sm text-subtle">
                    {invite.email} · {invite.roles?.name} ·{" "}
                    {invitationState(invite.status, invite.expires_at)}
                  </p>
                  <p className="text-xs text-subtle">
                    Branches: {invitedBranches.join(", ") || "All branches"} ·{" "}
                    Expires {new Date(invite.expires_at).toLocaleString()}
                  </p>
                </div>
                {permissions.has("team.invite") && (
                  <div className="flex gap-2">
                    <form action={resendInvitation.bind(null, invite.id)}>
                      <button className="rounded border px-3 py-2 text-sm">
                        Resend
                      </button>
                    </form>
                    <form action={revokeInvitation.bind(null, invite.id)}>
                      <button className="rounded border border-danger px-3 py-2 text-sm text-danger">
                        Revoke
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
          {!invitations?.length && (
            <p className="text-sm text-subtle">No pending invitations.</p>
          )}
        </div>
      </section>
    </>
  );
}
