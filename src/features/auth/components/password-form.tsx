"use client";

import { useActionState } from "react";
import {
  forgotPassword,
  resetPassword,
  type AuthActionState,
} from "../actions";

export function PasswordForm({ mode }: { mode: "forgot" | "reset" }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    mode === "forgot" ? forgotPassword : resetPassword,
    {},
  );
  return (
    <form action={action} className="mt-8 space-y-5">
      {mode === "forgot" ? (
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
        />
      ) : (
        <>
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
          />
          <Field
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
          />
        </>
      )}
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-warning-soft p-3 text-sm text-warning"
        >
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : mode === "forgot"
            ? "Send reset link"
            : "Change password"}
      </button>
    </form>
  );
}
function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        required
        {...props}
        className="mt-2 min-h-11 w-full rounded-lg border bg-surface px-3"
      />
    </label>
  );
}
