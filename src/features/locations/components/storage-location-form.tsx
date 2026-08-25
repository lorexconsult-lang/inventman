"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import { createStorageLocation, type LocationActionState } from "../actions";

export function StorageLocationForm({
  branchId,
  warehouseId,
  locations,
}: {
  branchId: string;
  warehouseId: string;
  locations: Array<{ id: string; name: string; code: string }>;
}) {
  const [state, action, pending] = useActionState<
    LocationActionState,
    FormData
  >(createStorageLocation, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <ActionFeedback {...state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location name" name="name" required />
        <Field label="Code" name="code" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Parent location" name="parentLocationId" required>
          <option value="">Select a parent</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} · {location.code}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Location type"
          name="locationType"
          defaultValue="BIN"
        >
          <option value="ZONE">Zone</option>
          <option value="AISLE">Aisle</option>
          <option value="RACK">Rack</option>
          <option value="SHELF">Shelf</option>
          <option value="BIN">Bin</option>
          <option value="OTHER">Other</option>
        </SelectField>
      </div>
      <TextareaField label="Description" name="description" />
      <Button disabled={pending}>
        {pending ? "Creating…" : "Add storage location"}
      </Button>
    </form>
  );
}
