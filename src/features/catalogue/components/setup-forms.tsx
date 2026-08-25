"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import {
  createBrand,
  createCategory,
  createPriceList,
  createTaxProfile,
  createUnit,
  type CatalogueActionState,
} from "../actions";

const initial: CatalogueActionState = {};
export function CategoryForm({
  categories,
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, action, pending] = useActionState(createCategory, initial);
  return (
    <Form action={action} state={state}>
      <Field label="Name" name="name" required />
      <Field
        label="Slug"
        name="slug"
        required
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
      />
      <SelectField label="Parent category" name="parentId">
        <option value="">Top level</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Description" name="description" />
      <Button disabled={pending}>{pending ? "Saving…" : "Add category"}</Button>
    </Form>
  );
}
export function BrandForm() {
  const [state, action, pending] = useActionState(createBrand, initial);
  return (
    <Form action={action} state={state}>
      <Field label="Brand name" name="name" required />
      <TextareaField label="Description" name="description" />
      <Button disabled={pending}>{pending ? "Saving…" : "Add brand"}</Button>
    </Form>
  );
}
export function UnitForm() {
  const [state, action, pending] = useActionState(createUnit, initial);
  return (
    <Form action={action} state={state}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Unit name" name="name" required />
        <Field label="Symbol" name="symbol" required />
      </div>
      <SelectField label="Dimension" name="dimension">
        <option>COUNT</option>
        <option>WEIGHT</option>
        <option>VOLUME</option>
        <option>LENGTH</option>
        <option>AREA</option>
        <option>OTHER</option>
      </SelectField>
      <Button disabled={pending}>{pending ? "Saving…" : "Add unit"}</Button>
    </Form>
  );
}
export function TaxForm() {
  const [state, action, pending] = useActionState(createTaxProfile, initial);
  return (
    <Form action={action} state={state}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tax name" name="name" required />
        <Field label="Code" name="code" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Rate (%)"
          name="rate"
          type="number"
          min="0"
          max="100"
          step="0.000001"
          defaultValue="0"
        />
        <SelectField label="Calculation" name="calculation">
          <option>EXCLUSIVE</option>
          <option>INCLUSIVE</option>
        </SelectField>
        <SelectField label="Treatment" name="taxTreatment">
          <option>STANDARD</option>
          <option>ZERO_RATED</option>
          <option>EXEMPT</option>
        </SelectField>
      </div>
      <Button disabled={pending}>
        {pending ? "Saving…" : "Add tax profile"}
      </Button>
    </Form>
  );
}
export function PriceListForm({ currency }: { currency: string }) {
  const [state, action, pending] = useActionState(createPriceList, initial);
  return (
    <Form action={action} state={state}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" name="name" required />
        <Field label="Code" name="code" required />
        <Field
          label="Currency"
          name="currencyCode"
          maxLength={3}
          defaultValue={currency}
          required
        />
      </div>
      <TextareaField label="Description" name="description" />
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="isDefault" />
        Make default price list
      </label>
      <Button disabled={pending}>
        {pending ? "Saving…" : "Add price list"}
      </Button>
    </Form>
  );
}
function Form({
  action,
  state,
  children,
}: {
  action: (payload: FormData) => void;
  state: CatalogueActionState;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="space-y-4">
      <ActionFeedback {...state} />
      {children}
    </form>
  );
}
