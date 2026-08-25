"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = { error?: string };

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  currencyCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  timezone: z.string().trim().min(1).max(100),
});

export async function createOrganization(
  _: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  await requireAuthenticatedUser();
  const input = schema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Check your organization details" };

  const client = await createClient();
  const { error } = await client.rpc("create_organization", {
    organization_name: input.data.name,
    organization_slug: input.data.slug,
    country_code: input.data.countryCode,
    currency_code: input.data.currencyCode,
    organization_timezone: input.data.timezone,
  });
  if (error) return { error: error.code === "23505" ? "That organization slug is already in use" : "Organization creation failed" };
  redirect("/dashboard");
}
