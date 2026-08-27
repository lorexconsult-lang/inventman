import "server-only";

import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function getOrganizationContext() {
  const user = await requireAuthenticatedUser();
  const client = await createClient();
  const { data: memberships, error: membershipError } = await client
    .from("organization_members")
    .select("id,organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at");
  if (membershipError || !memberships?.length) redirect("/onboarding");
  const selectedId = (await cookies()).get("inventman-organization")?.value;
  const selected = memberships.find(
    (item) => item.organization_id === selectedId,
  );
  if (!selected && memberships.length > 1) redirect("/select-organization");
  const membership = selected ?? memberships[0];
  const organizationId = membership.organization_id;

  const [{ data: organization }, { data: businesses }] = await Promise.all([
    client
      .from("organizations")
      .select("id,name,country_code,currency_code,timezone,status")
      .eq("id", organizationId)
      .single(),
    client
      .from("businesses")
      .select("id,name")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("created_at")
      .limit(1),
  ]);
  const business = businesses?.[0];
  if (!organization || !business)
    throw new Error("Organization foundation is incomplete");
  return { client, user, membership, organization, business };
}

export async function requireOrganizationPermission(permission: string) {
  const context = await getOrganizationContext();
  const { data, error } = await context.client.rpc("has_permission", {
    target_organization_id: context.organization.id,
    permission_code: permission,
  });
  if (error || !data) forbidden();
  return context;
}

export async function getAvailableOrganizations() {
  const user = await requireAuthenticatedUser();
  const client = await createClient();
  const { data, error } = await client
    .from("organization_members")
    .select("organization_id,organizations(id,name,status)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at");
  if (error) throw new Error("Organizations could not be loaded");
  return (data ?? []).flatMap((item) =>
    item.organizations ? [item.organizations] : [],
  );
}

export async function getEffectivePermissions(organizationId: string) {
  await requireAuthenticatedUser();
  const client = await createClient();
  const { data, error } = await client.rpc("get_effective_permissions", {
    target_organization_id: organizationId,
  });
  if (error) return new Set<string>();
  return new Set(data ?? []);
}
