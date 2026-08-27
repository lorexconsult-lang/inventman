"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPublicEnvironment } from "@/lib/env/public";
import { getOrganizationContext } from "@/features/organizations/context";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

const token = () => randomBytes(32).toString("base64url");
const ids = (formData: FormData, name: string) =>
  formData.getAll(name).map(String).filter(Boolean);

function message(error: { message?: string } | null) {
  const value = error?.message ?? "REQUEST_FAILED";
  const map: Record<string, string> = {
    ACTIVE_INVITATION_EXISTS:
      "An active invitation already exists for this email.",
    CANNOT_GRANT_PERMISSION: "You cannot grant a permission you do not hold.",
    CROSS_TENANT_REFERENCE:
      "The selected record is not available in this organization.",
    LAST_OWNER_PROTECTED:
      "The last organization owner cannot be changed or suspended.",
    ROLE_HAS_ACTIVE_MEMBERS:
      "Move active members to another role before deactivating this role.",
    ROLE_NOT_ASSIGNABLE: "That role cannot be assigned.",
    SELF_PRIVILEGE_CHANGE_DENIED:
      "You cannot change your own critical privileges.",
    SELF_STATUS_CHANGE_DENIED: "You cannot suspend or deactivate yourself.",
  };
  return map[value] ?? "The access change could not be completed.";
}

export async function createRole(formData: FormData) {
  const { client, organization } = await getOrganizationContext();
  const { data, error } = await client.rpc("create_team_role", {
    target_organization_id: organization.id,
    target_name: String(formData.get("name") ?? ""),
    target_description: String(formData.get("description") ?? ""),
    target_permission_ids: ids(formData, "permissionId"),
  });
  if (error || !data)
    redirect(
      `/dashboard/settings/roles/new?error=${encodeURIComponent(message(error))}`,
    );
  redirect(`/dashboard/settings/roles/${data}`);
}

export async function updateRole(roleId: string, formData: FormData) {
  const { client, organization } = await getOrganizationContext();
  const { error } = await client.rpc("update_team_role", {
    target_organization_id: organization.id,
    target_role_id: roleId,
    target_name: String(formData.get("name") ?? ""),
    target_description: String(formData.get("description") ?? ""),
    target_permission_ids: ids(formData, "permissionId"),
    target_is_active: formData.get("isActive") === "on",
  });
  if (error)
    redirect(
      `/dashboard/settings/roles/${roleId}?error=${encodeURIComponent(message(error))}`,
    );
  revalidatePath("/dashboard/settings/roles");
  redirect(`/dashboard/settings/roles/${roleId}?saved=1`);
}

async function deliverInvitation(email: string, invitationToken: string) {
  const clientContext = await getOrganizationContext();
  const base = getPublicEnvironment().NEXT_PUBLIC_APP_URL;
  return clientContext.client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${base}/auth/callback?next=${encodeURIComponent(`/invite?token=${invitationToken}`)}`,
      shouldCreateUser: true,
    },
  });
}

export async function inviteMember(formData: FormData) {
  const { client, organization } = await getOrganizationContext();
  const invitationToken = token();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const { data, error } = await client.rpc("invite_team_member", {
    target_organization_id: organization.id,
    target_email: email,
    target_display_name: String(formData.get("displayName") ?? ""),
    target_role_id: String(formData.get("roleId") ?? ""),
    target_branch_ids: ids(formData, "branchId"),
    target_note: String(formData.get("note") ?? ""),
    target_token: invitationToken,
    target_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  if (error || !data)
    redirect(
      `/dashboard/settings/team/invite?error=${encodeURIComponent(message(error))}`,
    );
  const delivery = await deliverInvitation(email, invitationToken);
  if (delivery.error)
    redirect(
      `/dashboard/settings/team?warning=${encodeURIComponent("Invitation saved, but development email delivery failed. Resend after SMTP is available.")}`,
    );
  redirect("/dashboard/settings/team?invited=1");
}

export async function resendInvitation(invitationId: string) {
  const { client, organization } = await getOrganizationContext();
  const invitationToken = token();
  const { data: email, error } = await client.rpc("resend_team_invitation", {
    target_organization_id: organization.id,
    target_invitation_id: invitationId,
    target_token: invitationToken,
    target_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  if (error || !email)
    redirect(
      `/dashboard/settings/team?error=${encodeURIComponent(message(error))}`,
    );
  const delivery = await deliverInvitation(email, invitationToken);
  if (delivery.error)
    redirect(
      `/dashboard/settings/team?warning=${encodeURIComponent("Invitation rotated securely, but email delivery failed.")}`,
    );
  redirect("/dashboard/settings/team?resent=1");
}

export async function revokeInvitation(invitationId: string) {
  const { client, organization } = await getOrganizationContext();
  const { error } = await client.rpc("revoke_team_invitation", {
    target_organization_id: organization.id,
    target_invitation_id: invitationId,
  });
  if (error)
    redirect(
      `/dashboard/settings/team?error=${encodeURIComponent(message(error))}`,
    );
  revalidatePath("/dashboard/settings/team");
}

export async function acceptInvitation(formData: FormData) {
  const invitationToken = String(formData.get("token") ?? "");
  await requireAuthenticatedUser();
  const client = await createClient();
  const { data, error } = await client.rpc("accept_team_invitation", {
    target_token: invitationToken,
  });
  if (error || !data)
    redirect(
      `/invite?token=${encodeURIComponent(invitationToken)}&error=${encodeURIComponent(error?.message ?? "INVITATION_INVALID")}`,
    );
  const cookieStore = await import("next/headers").then(({ cookies }) =>
    cookies(),
  );
  cookieStore.set("inventman-organization", data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 31536000,
  });
  redirect("/dashboard");
}

export async function assignRoles(memberId: string, formData: FormData) {
  const { client, organization } = await getOrganizationContext();
  const { error } = await client.rpc("assign_team_member_roles", {
    target_organization_id: organization.id,
    target_membership_id: memberId,
    target_role_ids: ids(formData, "roleId"),
  });
  if (error)
    redirect(
      `/dashboard/settings/team/${memberId}?error=${encodeURIComponent(message(error))}`,
    );
  revalidatePath(`/dashboard/settings/team/${memberId}`);
}

export async function updateBranchAccess(memberId: string, formData: FormData) {
  const { client, organization } = await getOrganizationContext();
  const branches =
    formData.get("allBranches") === "on" ? [] : ids(formData, "branchId");
  const { error } = await client.rpc("update_team_member_branches", {
    target_organization_id: organization.id,
    target_membership_id: memberId,
    target_branch_ids: branches,
  });
  if (error)
    redirect(
      `/dashboard/settings/team/${memberId}?error=${encodeURIComponent(message(error))}`,
    );
  revalidatePath(`/dashboard/settings/team/${memberId}`);
}

export async function setMemberStatus(
  memberId: string,
  status: "active" | "suspended" | "deactivated",
  formData: FormData,
) {
  const { client, organization } = await getOrganizationContext();
  const { error } = await client.rpc("set_team_member_status", {
    target_organization_id: organization.id,
    target_membership_id: memberId,
    target_status: status,
    target_reason: String(formData.get("reason") ?? ""),
  });
  if (error)
    redirect(
      `/dashboard/settings/team/${memberId}?error=${encodeURIComponent(message(error))}`,
    );
  revalidatePath(`/dashboard/settings/team/${memberId}`);
}
