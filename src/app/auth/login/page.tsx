import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function LoginPage() {
  return <div className="mx-auto max-w-md py-12"><p className="text-sm font-semibold text-accent">Welcome back</p><h1 className="mt-2 text-3xl font-semibold">Sign in to your workspace</h1><p className="mt-3 text-subtle">Use the verified email address linked to your account.</p><AuthForm mode="login" /><p className="mt-6 text-center text-sm text-subtle">New here? <Link className="font-semibold text-accent hover:underline" href="/auth/register">Create an account</Link></p></div>;
}
