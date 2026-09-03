"use server";

import { redirect } from "next/navigation";
import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registrationSchema,
  resetPasswordSchema,
  verificationSchema,
} from "./schemas/credentials";
import { safePlanCode, sanitizeAttribution } from "@/features/commercial/domain";

export type AuthActionState = { error?: string };

export async function login(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = loginSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return { error: input.error.issues[0]?.message ?? "Check your details" };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error) return { error: "Email or password is incorrect" };
  const next = String(formData.get("next") ?? "");
  redirect(
    next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
  );
}

export async function register(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return { error: input.error.issues[0]?.message ?? "Check your details" };
  const client = await createClient();
  const plan = safePlanCode(formData.get("plan"));
  const continuation = plan ? `/onboarding?plan=${plan}` : "/onboarding";
  const { error } = await client.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: {
      data: { full_name: input.data.fullName, attribution: sanitizeAttribution(Object.fromEntries(formData)) },
      emailRedirectTo: `${getPublicEnvironment().NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(continuation)}`,
    },
  });
  if (error) return { error: "Registration could not be completed" };
  redirect(`/auth/check-email?email=${encodeURIComponent(input.data.email)}${plan ? `&plan=${plan}` : ""}`);
}

export async function logout() {
  const client = await createClient();
  await client.auth.signOut();
  redirect("/auth/login");
}

export async function verifyRegistration(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = verificationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return {
      error: input.error.issues[0]?.message ?? "Check the verification details",
    };
  const client = await createClient();
  const { error } = await client.auth.verifyOtp({
    email: input.data.email,
    token: input.data.token,
    type: "signup",
  });
  if (error) return { error: "The verification code is invalid or expired" };
  const plan = safePlanCode(formData.get("plan"));
  redirect(plan ? `/onboarding?plan=${plan}` : "/onboarding");
}

export async function forgotPassword(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message };
  const client = await createClient();
  await client.auth.resetPasswordForEmail(input.data.email, {
    redirectTo: `${getPublicEnvironment().NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/reset-password`,
  });
  redirect("/auth/check-email?mode=reset");
}

export async function resetPassword(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message };
  const client = await createClient();
  const { data } = await client.auth.getClaims();
  if (!data?.claims?.sub)
    return { error: "This reset link is invalid or expired." };
  const { error } = await client.auth.updateUser({
    password: input.data.password,
  });
  if (error)
    return {
      error: "Password could not be changed. Request a new reset link.",
    };
  redirect("/dashboard");
}
