import "server-only";

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function getOrganizationContext() {
  const user = await requireAuthenticatedUser();
  const client = await createClient();
  const { data: memberships, error: membershipError } = await client
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at")
    .limit(1);
  const organizationId = memberships?.[0]?.organization_id;
  if (membershipError || !organizationId) redirect("/onboarding");

  const [{ data: organization }, { data: businesses }] = await Promise.all([
    client
      .from("organizations")
      .select("id,name,country_code,currency_code,timezone")
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
  return { client, user, organization, business };
}

export async function requireOrganizationPermission(permission: string) {
  const context = await getOrganizationContext();
  const { data, error } = await context.client.rpc("has_permission", {
    target_organization_id: context.organization.id,
    permission_code: permission,
  });
  if (error || !data)
    throw new Error("You do not have permission to perform this action");
  return context;
}
