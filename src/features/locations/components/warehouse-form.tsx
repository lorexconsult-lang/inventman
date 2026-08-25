"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import {
  createWarehouse,
  updateWarehouse,
  type LocationActionState,
} from "../actions";

export function WarehouseForm({
  branchId,
  warehouse,
}: {
  branchId: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
    warehouse_type: string;
    description: string | null;
    is_default: boolean;
  };
}) {
  const [state, action, pending] = useActionState<
    LocationActionState,
    FormData
  >(warehouse ? updateWarehouse.bind(null, warehouse.id) : createWarehouse, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="branchId" value={branchId} />
      <ActionFeedback {...state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Warehouse name"
          name="name"
          defaultValue={warehouse?.name}
          required
        />
        <Field
          label="Code"
          name="code"
          defaultValue={warehouse?.code}
          required
        />
      </div>
      <SelectField
        label="Warehouse type"
        name="warehouseType"
        defaultValue={warehouse?.warehouse_type ?? "MAIN"}
      >
        <option value="MAIN">Main</option>
        <option value="SHOP_FLOOR">Shop floor</option>
        <option value="DISTRIBUTION">Distribution</option>
        <option value="RETURNS">Returns</option>
        <option value="DAMAGED">Damaged goods</option>
        <option value="EXPIRED">Expired goods</option>
        <option value="PRODUCTION">Production</option>
        <option value="TRANSIT">Transit</option>
        <option value="OTHER">Other</option>
      </SelectField>
      <TextareaField
        label="Description"
        name="description"
        defaultValue={warehouse?.description ?? ""}
      />
      <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-surface px-4 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={warehouse?.is_default}
        />{" "}
        Make this the branch default warehouse
      </label>
      <Button disabled={pending}>
        {pending ? "Creating…" : "Create warehouse"}
      </Button>
    </form>
  );
}
