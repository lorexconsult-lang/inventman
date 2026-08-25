"use server";

import { redirect } from "next/navigation";
import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registrationSchema, verificationSchema } from "./schemas/credentials";

export type AuthActionState = { error?: string };

export async function login(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const input = loginSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Check your details" };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error) return { error: "Email or password is incorrect" };
  redirect("/dashboard");
}

export async function register(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const input = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Check your details" };
  const client = await createClient();
  const { error } = await client.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: {
      data: { full_name: input.data.fullName },
      emailRedirectTo: `${getPublicEnvironment().NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  });
  if (error) return { error: "Registration could not be completed" };
  redirect("/auth/check-email");
}

export async function logout() {
  const client = await createClient();
  await client.auth.signOut();
  redirect("/auth/login");
}

export async function verifyRegistration(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const input = verificationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Check the verification details" };
  const client = await createClient();
  const { error } = await client.auth.verifyOtp({ email: input.data.email, token: input.data.token, type: "signup" });
  if (error) return { error: "The verification code is invalid or expired" };
  redirect("/onboarding");
}
