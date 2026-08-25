"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  createBranch,
  updateBranch,
  type LocationActionState,
} from "../actions";

type BranchDefaults = {
  id?: string;
  name?: string;
  code?: string;
  phone?: string | null;
  email?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  timezone?: string;
};
export function BranchForm({
  branch,
  defaultTimezone = "Europe/London",
}: {
  branch?: BranchDefaults;
  defaultTimezone?: string;
}) {
  const action = branch?.id ? updateBranch.bind(null, branch.id) : createBranch;
  const [state, formAction, pending] = useActionState<
    LocationActionState,
    FormData
  >(action, {});
  return (
    <form action={formAction} className="space-y-6">
      <ActionFeedback {...state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Branch name"
          name="name"
          required
          defaultValue={branch?.name}
        />
        <Field
          label="Branch code"
          name="code"
          required
          defaultValue={branch?.code}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Phone"
          name="phone"
          type="tel"
          defaultValue={branch?.phone ?? ""}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={branch?.email ?? ""}
        />
      </div>
      <Field
        label="Address line 1"
        name="addressLine1"
        defaultValue={branch?.address_line_1 ?? ""}
      />
      <Field
        label="Address line 2"
        name="addressLine2"
        defaultValue={branch?.address_line_2 ?? ""}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="City" name="city" defaultValue={branch?.city ?? ""} />
        <Field
          label="State / region"
          name="region"
          defaultValue={branch?.region ?? ""}
        />
        <Field
          label="Postal code"
          name="postalCode"
          defaultValue={branch?.postal_code ?? ""}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Country code"
          name="countryCode"
          maxLength={2}
          defaultValue={branch?.country_code ?? ""}
        />
        <Field
          label="Timezone"
          name="timezone"
          required
          defaultValue={branch?.timezone ?? defaultTimezone}
        />
      </div>
      <Button disabled={pending}>
        {pending ? "Saving…" : branch?.id ? "Save branch" : "Create branch"}
      </Button>
    </form>
  );
}
