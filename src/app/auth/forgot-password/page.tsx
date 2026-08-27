import Link from "next/link";
import { PasswordForm } from "@/features/auth/components/password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md p-6 sm:py-16">
      <h1 className="text-3xl font-bold">Reset your password</h1>
      <p className="mt-2 text-subtle">
        We will send a secure, expiring reset link if the account exists.
      </p>
      <PasswordForm mode="forgot" />
      <Link
        href="/auth/login"
        className="mt-6 block text-center text-sm text-accent"
      >
        Back to sign in
      </Link>
    </main>
  );
}
