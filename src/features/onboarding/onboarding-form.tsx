"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createOrganization, type OnboardingActionState } from "./actions";

export function OnboardingForm({plan}:{plan?:string}) {
  const [state, action, pending] = useActionState<
    OnboardingActionState,
    FormData
  >(createOrganization, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      {plan&&<input type="hidden" name="plan" value={plan}/>}
      <Field
        label="Organization name"
        name="name"
        autoComplete="organization"
      />
      <Field
        label="Organization slug"
        name="slug"
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        placeholder="example-company"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Country code"
          name="countryCode"
          maxLength={2}
          defaultValue="GB"
        />
        <Field
          label="Currency code"
          name="currencyCode"
          maxLength={3}
          defaultValue="GBP"
        />
      </div>
      <Field label="Timezone" name="timezone" defaultValue="Europe/London" />
      <label className="block text-sm font-medium"><span>Business type</span><select required name="businessType" defaultValue="GENERAL" className="mt-2 min-h-11 w-full rounded-lg border bg-surface px-3"><option value="RETAIL">Retail / Supermarket</option><option value="RESTAURANT">Restaurant / Lounge</option><option value="HOSPITALITY">Hotel / Hospitality</option><option value="PHARMACY">Pharmacy / Health Retail</option><option value="ELECTRONICS">Electronics / Gadgets</option><option value="WHOLESALE">Wholesale / Distribution</option><option value="GENERAL">General Business</option><option value="OTHER">Other</option></select></label>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-warning-soft p-3 text-sm text-warning"
        >
          {state.error}
        </p>
      )}
      <Button className="w-full" disabled={pending}>
        {pending ? "Creating organization…" : "Create organization"}
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
