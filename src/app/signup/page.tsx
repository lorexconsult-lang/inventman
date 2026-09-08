import type { Metadata } from "next";
import Link from "next/link";
import { InventmanLogo } from "@/components/brand/inventman-logo";
import { AuthForm } from "@/features/auth/components/auth-form";
import { safePlanCode, sanitizeAttribution } from "@/features/commercial/domain";

export const metadata: Metadata = { title: "Create Account", description: "Create your Inventman account and continue to secure business setup.", robots: { index: false, follow: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const plan = safePlanCode(query.plan);
  const attribution = sanitizeAttribution(query) as Record<string, string>;
  return <main className="auth-commercial"><Link className="auth-commercial-brand" href="/" aria-label="Inventman home"><InventmanLogo variant="primary" decorative eager className="w-full max-w-sm" sizes="384px" /></Link><section><p className="eyebrow">Start securely</p><h1>Create your account</h1><p>Verify your identity before creating a business workspace. No payment is taken during account creation.</p><AuthForm mode="register" plan={plan ?? undefined} attribution={attribution} /><p>Already registered? <Link href={`/login${plan ? `?next=${encodeURIComponent(`/onboarding?plan=${plan}`)}` : ""}`}>Sign in</Link></p></section></main>;
}
