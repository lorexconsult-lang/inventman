"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { login, register, type AuthActionState } from "../actions";
import Link from "next/link";

export function AuthForm({
  mode,
  next,
  plan,
  attribution,
}: {
  mode: "login" | "register";
  next?: string;
  plan?: string;
  attribution?: Record<string, string>;
}) {
  const action = mode === "login" ? login : register;
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(action, {});
  return (
    <form action={formAction} className="mt-8 space-y-5">
      {mode === "login" && next && (
        <input type="hidden" name="next" value={next} />
      )}
      {mode === "register" && (
        <><Field label="Full name" name="fullName" autoComplete="name" />{plan&&<input type="hidden" name="plan" value={plan}/>} {Object.entries(attribution ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}</>
      )}
      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
      />
      {mode === "register"&&<p className="text-xs text-subtle">Use at least 10 characters with upper and lower case letters and a number.</p>}
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-warning-soft p-3 text-sm text-warning"
        >
          {state.error}
        </p>
      )}
      <Button className="w-full" disabled={pending}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </Button>
      {mode === "login" && (
        <p className="text-center text-sm">
          <Link
            className="text-accent hover:underline"
            href="/auth/forgot-password"
          >
            Forgot password?
          </Link>
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      <input
        required
        className="mt-2 min-h-11 w-full rounded-lg border bg-surface px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        {...props}
      />
    </label>
  );
}
