"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/features/organizations/context";

export type OnboardingActionState = { error?: string };

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  currencyCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  timezone: z.string().trim().min(1).max(100),
  businessType: z.enum(["RETAIL","RESTAURANT","HOSPITALITY","PHARMACY","ELECTRONICS","WHOLESALE","GENERAL","OTHER"]),
  plan: z.string().trim().optional(),
});

export async function createOrganization(
  _: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  await requireAuthenticatedUser();
  const input = schema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Check your organization details" };

  const client = await createClient();
  const { error } = await client.rpc("create_commercial_organization" as never, {
    organization_name: input.data.name,
    organization_slug: input.data.slug,
    country_code: input.data.countryCode,
    currency_code: input.data.currencyCode,
    organization_timezone: input.data.timezone,
    target_business_type: input.data.businessType,
    target_plan_code: input.data.plan || null,
  } as never);
  if (error) return { error: error.code === "23505" ? "That organization slug is already in use" : "Organization creation failed" };
  redirect("/onboarding/setup");
}

export async function finishCommercialOnboarding() {
  const { client, organization } = await getOrganizationContext();
  const { data: state } = await client.from("organization_onboarding" as never).select("business_type,completed_steps").eq("organization_id", organization.id).maybeSingle() as {data:{business_type?:string;completed_steps?:string[]}|null};
  const { error } = await client.rpc("set_organization_onboarding" as never, { target_organization_id: organization.id, target_business_type: state?.business_type ?? "GENERAL", target_step: "FINISH", target_completed_steps: [...new Set([...(state?.completed_steps ?? []), "BUSINESS_PROFILE", "FINISH"])], target_complete: true } as never);
  if (error) redirect("/onboarding/setup?error=completion");
  redirect("/dashboard");
}
