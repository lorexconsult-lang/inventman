import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireAuthenticatedUser();
  const client = await createClient();
  const { data } = await client.from("organization_members").select("id").eq("user_id", user.id).eq("status", "active").limit(1);
  if (data?.length) redirect("/dashboard");

  return <div className="mx-auto max-w-xl py-12"><p className="text-sm font-semibold text-accent">Organization setup</p><h1 className="mt-2 text-3xl font-semibold">Create your workspace</h1><p className="mt-3 text-subtle">This atomic step creates your organization, active owner membership, Owner role, and initial capability grants.</p><OnboardingForm /></div>;
}
