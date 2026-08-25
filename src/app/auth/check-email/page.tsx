import { VerificationForm } from "@/features/auth/components/verification-form";

export default function CheckEmailPage() {
  return <div className="mx-auto max-w-md py-20 text-center"><p className="text-sm font-semibold text-accent">Verification required</p><h1 className="mt-2 text-3xl font-semibold">Check your email</h1><p className="mt-3 text-subtle">Enter the one-time code from the Supabase verification message, or follow its secure PKCE link.</p><VerificationForm /></div>;
}
