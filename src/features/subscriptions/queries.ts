import "server-only";
import { cache } from "react";
import { forbidden } from "next/navigation";
import { getOrganizationContext } from "@/features/organizations/context";
import { createClient } from "@/lib/supabase/server";
import { parseCommercialAccessMode } from "./domain";

export const getCommercialAccessMode = cache(async () => {
  const client = await createClient();
  const { data, error } = await client.rpc("platform_commercial_access_mode");
  if (error) return "SUBSCRIPTION" as const;
  return parseCommercialAccessMode(data);
});

export async function getTenantBilling() {
  const context = await getOrganizationContext();
  const { client, organization } = context;
  const [subscriptions, plans, usage, billing, entitlements, accessMode] = await Promise.all([
    client.from("organization_subscriptions").select("*,saas_plans(code,name,description)").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    client.from("saas_plans").select("*,plan_entitlements(*)").eq("status", "ACTIVE").eq("is_public", true).order("display_order"),
    client.rpc("organization_usage", { target_organization_id: organization.id }),
    client.from("platform_billing_transactions").select("*,saas_plans(name)").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(50),
    client.from("organization_entitlement_overrides").select("*").eq("organization_id", organization.id),
    client.rpc("platform_commercial_access_mode"),
  ]);
  return { ...context, accessMode: parseCommercialAccessMode(accessMode.data), subscription: subscriptions.data?.[0] ?? null, subscriptions: subscriptions.data ?? [], plans: plans.data ?? [], usage: usage.data ?? {}, billing: billing.data ?? [], overrides: entitlements.data ?? [] };
}

export async function requirePlatformAdmin(capability = "platform.tenants.view") {
  const client = await createClient();
  const { data } = await client.rpc("is_platform_admin", { required_capability: capability });
  if (!data) forbidden();
  return client;
}

export async function getPlatformOverview() {
  const client = await requirePlatformAdmin();
  const [organizations, subscriptions, plans, audit, admins, accessMode] = await Promise.all([
    client.from("organizations").select("id,name,slug,status,created_at,platform_suspended_at,organization_members(count),branches(count)"),
    client.from("organization_subscriptions").select("*,saas_plans(code,name)").order("created_at", { ascending: false }),
    client.from("saas_plans").select("*,plan_entitlements(*)").order("display_order"),
    client.from("platform_audit_events").select("*").order("created_at", { ascending: false }).limit(100),
    client.from("platform_admins").select("user_id,status,capabilities,created_at"),
    client.rpc("platform_commercial_access_mode"),
  ]);
  return { accessMode: parseCommercialAccessMode(accessMode.data), organizations: organizations.data ?? [], subscriptions: subscriptions.data ?? [], plans: plans.data ?? [], audit: audit.data ?? [], admins: admins.data ?? [] };
}
