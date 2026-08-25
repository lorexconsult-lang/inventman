import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function RegisterPage() {
  return <div className="mx-auto max-w-md py-12"><p className="text-sm font-semibold text-accent">Start securely</p><h1 className="mt-2 text-3xl font-semibold">Create your account</h1><p className="mt-3 text-subtle">Your organization and operating settings are configured after verification.</p><AuthForm mode="register" /><p className="mt-6 text-center text-sm text-subtle">Already registered? <Link className="font-semibold text-accent hover:underline" href="/auth/login">Sign in</Link></p></div>;
}
