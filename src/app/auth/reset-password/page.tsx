import { PasswordForm } from "@/features/auth/components/password-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md p-6 sm:py-16">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-subtle">
        Reset links are single-purpose and expire according to the
        authentication policy.
      </p>
      <PasswordForm mode="reset" />
    </main>
  );
}
