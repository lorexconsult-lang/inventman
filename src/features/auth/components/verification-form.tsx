"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { verifyRegistration, type AuthActionState } from "../actions";

export function VerificationForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    verifyRegistration,
    {},
  );
  return (
    <form action={action} className="mt-8 space-y-5 text-left">
      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
      />
      <Field
        label="One-time code"
        name="token"
        inputMode="numeric"
        autoComplete="one-time-code"
        minLength={6}
        maxLength={8}
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
        {pending ? "Verifying…" : "Verify email"}
      </Button>
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
