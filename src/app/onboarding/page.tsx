import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { createClient } from "@/lib/supabase/server";
import { safePlanCode } from "@/features/commercial/domain";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({searchParams}:{searchParams:Promise<{plan?:string}>}) {
  const user = await requireAuthenticatedUser();
  const client = await createClient();
  const { data } = await client.from("organization_members").select("organization_id").eq("user_id", user.id).eq("status", "active").order("created_at").limit(1);
  const organizationId = data?.[0]?.organization_id;
  if (organizationId) {
    const { data: onboarding } = await client
      .from("organization_onboarding")
      .select("completed_at")
      .eq("organization_id", organizationId)
      .maybeSingle();
    redirect(onboarding && !onboarding.completed_at ? "/onboarding/setup" : "/dashboard");
  }

  const plan=safePlanCode((await searchParams).plan)??undefined;
  return <div className="mx-auto max-w-xl py-12"><p className="text-sm font-semibold text-accent">Business setup · Step 1 of 7</p><h1 className="mt-2 text-3xl font-semibold">Create your workspace</h1><p className="mt-3 text-subtle">This atomic step creates your organization, active owner membership, configured trial and durable onboarding state.</p><OnboardingForm plan={plan} /></div>;
}
