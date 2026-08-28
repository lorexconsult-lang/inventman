"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { requirePlatformAdmin } from "./queries";

const uuid = z.string().uuid();
function platformDone(key: string): never { revalidatePath("/platform-admin", "layout"); redirect(`/platform-admin?${key}=1`); }

export async function requestPlanChange(form: FormData) {
  const input = z.object({ planId: uuid, interval: z.enum(["MONTHLY", "ANNUAL"]) }).safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/dashboard/settings/billing?error=INVALID_PLAN_TRANSITION");
  await requireOrganizationPermission("organizations.manage");
  // Paid activation remains provider/webhook authoritative. No client-side subscription mutation occurs here.
  redirect(`/dashboard/settings/billing?checkout=unavailable&plan=${input.data.planId}&interval=${input.data.interval}`);
}

export async function cancelAtPeriodEnd() {
  const { client, organization } = await requireOrganizationPermission("organizations.manage");
  const { error } = await client.rpc("cancel_organization_subscription", { target_organization_id: organization.id });
  if (error) redirect("/dashboard/settings/billing?error=INVALID_PLAN_TRANSITION");
  revalidatePath("/dashboard/settings/billing"); redirect("/dashboard/settings/billing?cancelled=1");
}

export async function createPlan(form: FormData) {
  const input = z.object({ code: z.string().trim().min(2), name: z.string().trim().min(2), description: z.string(), currency: z.string().regex(/^[A-Z]{3}$/), monthlyPrice: z.coerce.number().nonnegative(), annualPrice: z.coerce.number().nonnegative(), trialDays: z.coerce.number().int().min(0).max(365), isPublic: z.string().optional() }).safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/platform-admin/plans?error=invalid");
  const client = await requirePlatformAdmin("platform.plans.manage");
  const { error } = await client.rpc("platform_create_plan", { target_code: input.data.code, target_name: input.data.name, target_description: input.data.description, target_currency: input.data.currency, target_monthly_price: input.data.monthlyPrice, target_annual_price: input.data.annualPrice, target_trial_days: input.data.trialDays, target_is_public: input.data.isPublic === "on" });
  if (error) redirect(`/platform-admin/plans?error=${encodeURIComponent(error.message)}`); platformDone("planCreated");
}

export async function changeSubscription(form: FormData) {
  const input = z.object({ organizationId: uuid, planId: uuid, interval: z.enum(["MONTHLY", "ANNUAL"]), status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "CANCELLED", "EXPIRED", "SUSPENDED"]), reason: z.string().trim().min(3) }).safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/platform-admin?error=invalid");
  const client = await requirePlatformAdmin("platform.subscriptions.manage");
  const { error } = await client.rpc("platform_change_subscription", { target_organization_id: input.data.organizationId, target_plan_id: input.data.planId, target_interval: input.data.interval, target_status: input.data.status, target_effective_at: new Date().toISOString(), target_reason: input.data.reason });
  if (error) redirect(`/platform-admin?error=${encodeURIComponent(error.message)}`); platformDone("subscriptionChanged");
}

export async function setTenantSuspension(form: FormData) {
  const input = z.object({ organizationId: uuid, suspended: z.enum(["true", "false"]), reason: z.string().trim().min(3) }).safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/platform-admin?error=invalid");
  const client = await requirePlatformAdmin("platform.tenants.manage");
  const { error } = await client.rpc("platform_set_tenant_suspension", { target_organization_id: input.data.organizationId, target_suspended: input.data.suspended === "true", target_reason: input.data.reason });
  if (error) redirect(`/platform-admin?error=${encodeURIComponent(error.message)}`); platformDone(input.data.suspended === "true" ? "suspended" : "reactivated");
}
