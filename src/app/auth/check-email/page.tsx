import { VerificationForm } from "@/features/auth/components/verification-form";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const reset = mode === "reset";
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-sm font-semibold text-accent">
        {reset ? "Password recovery" : "Verification required"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Check your email</h1>
      <p className="mt-3 text-subtle">
        {reset
          ? "If an account exists, a secure password-reset link has been sent. The link expires according to the authentication policy."
          : "Enter the one-time code from the Supabase verification message, or follow its secure PKCE link."}
      </p>
      {!reset && <VerificationForm />}
    </div>
  );
}
