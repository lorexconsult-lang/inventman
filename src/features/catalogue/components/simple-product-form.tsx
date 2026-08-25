"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import { createSimpleProduct, type CatalogueActionState } from "../actions";

type Choice = { id: string; name: string };
export function SimpleProductForm({
  categories,
  brands,
  units,
  taxes,
  priceLists,
}: {
  categories: Choice[];
  brands: Choice[];
  units: Array<Choice & { symbol: string }>;
  taxes: Choice[];
  priceLists: Array<Choice & { currency_code: string; is_default: boolean }>;
}) {
  const [state, action, pending] = useActionState<
    CatalogueActionState,
    FormData
  >(createSimpleProduct, {});
  const [type, setType] = useState("STOCKED_PRODUCT");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <ActionFeedback {...state} />
      {state.productId && (
        <Link
          href={`/dashboard/catalogue/${state.productId}`}
          className="font-semibold text-accent"
        >
          View product →
        </Link>
      )}
      <Section
        title="General"
        description="Shared catalogue identity and classification."
      >
        <Field label="Product name" name="name" required />
        <TextareaField
          label="Description"
          name="description"
          disabled
          title="Description editing is available after creation"
        />
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField
            label="Product type"
            name="productType"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {[
              "STOCKED_PRODUCT",
              "NON_STOCKED_PRODUCT",
              "SERVICE",
              "BUNDLE",
              "RECIPE",
              "SERIALIZED_PRODUCT",
              "BATCH_CONTROLLED_PRODUCT",
              "PERISHABLE_PRODUCT",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </SelectField>
          <SelectField label="Category" name="categoryId">
            <option value="">Uncategorized</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Brand" name="brandId">
            <option value="">No brand</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
        </div>
      </Section>
      <Section
        title="Default variant"
        description="Simple products receive a Default variant automatically."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="SKU" hint="Leave blank to generate" name="sku" />
          <Field label="Barcode" name="barcode" />
          <SelectField label="Base unit" name="unitId" required>
            <option value="">Select unit</option>
            {units.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.symbol})
              </option>
            ))}
          </SelectField>
        </div>
      </Section>
      <Section
        title="Pricing & reference cost"
        description="Reference cost is catalogue metadata, never authoritative inventory valuation."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField label="Price list" name="priceListId">
            <option value="">No opening price</option>
            {priceLists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.currency_code}
                {item.is_default ? " (default)" : ""}
              </option>
            ))}
          </SelectField>
          <Field
            label="Selling price"
            name="price"
            type="number"
            min="0"
            step="0.0001"
          />
          <Field
            label="Reference purchase cost"
            name="referenceCost"
            type="number"
            min="0"
            step="0.0001"
          />
        </div>
      </Section>
      <Section
        title="Inventory configuration"
        description="Configuration only—no physical stock balance exists in this phase."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Reorder point"
            name="reorderPoint"
            type="number"
            min="0"
            step="0.000001"
          />
          <SelectField label="Tax profile" name="taxProfileId">
            <option value="">No default tax</option>
            {taxes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border px-4 text-sm">
            <input
              type="checkbox"
              name="trackInventory"
              defaultChecked={type !== "SERVICE"}
              disabled={type === "SERVICE"}
            />
            Track in future inventory ledger
          </label>
        </div>
      </Section>
      <Button disabled={pending}>
        {pending ? "Creating product…" : "Create simple product"}
      </Button>
    </form>
  );
}
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border bg-surface p-5 sm:p-7">
      <legend className="px-2 text-lg font-semibold">{title}</legend>
      <p className="mb-6 text-sm text-subtle">{description}</p>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}
