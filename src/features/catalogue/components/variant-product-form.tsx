"use client";

import Link from "next/link";
import { useMemo, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/field";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { createVariantProduct, type CatalogueActionState } from "../actions";
import { ProductCreationToast } from "./product-creation-toast";
import {
  generateVariantCombinations,
  type VariantOption,
} from "../variant-combinations";

type Choice = { id: string; name: string };
export function VariantProductForm({
  categories,
  brands,
  taxes,
}: {
  categories: Choice[];
  brands: Choice[];
  taxes: Choice[];
}) {
  const [state, action, pending] = useActionState<
    CatalogueActionState,
    FormData
  >(createVariantProduct, {});
  const [key] = useState(() => crypto.randomUUID());
  const [options, setOptions] = useState<VariantOption[]>([
    { name: "Size", values: ["Small", "Large"] },
  ]);
  const combinations = useMemo(
    () => generateVariantCombinations(options),
    [options],
  );
  const definitions = combinations.map((item, index) => ({
    name: item.name,
    sku: "",
    attributes: item.attributes,
    sort_order: index,
  }));
  return (
    <form action={action} className="space-y-7">
      <ProductCreationToast state={state} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <input type="hidden" name="optionsJson" value={JSON.stringify(options)} />
      <input
        type="hidden"
        name="variantsJson"
        value={JSON.stringify(definitions)}
      />
      <ActionFeedback {...state} />
      {state.productId && (
        <Link
          className="font-semibold text-accent"
          href={`/dashboard/catalogue/${state.productId}`}
        >
          View product &rarr;
        </Link>
      )}
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Product</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Field label="Product name" name="name" required />
          <SelectField label="Product type" name="productType">
            <option>STOCKED_PRODUCT</option>
            <option>NON_STOCKED_PRODUCT</option>
            <option>SERVICE</option>
            <option>SERIALIZED_PRODUCT</option>
            <option>BATCH_CONTROLLED_PRODUCT</option>
            <option>PERISHABLE_PRODUCT</option>
          </SelectField>
          <Field
            label="Reference cost"
            name="referenceCost"
            type="number"
            min="0"
            step="0.0001"
          />
          <SelectField label="Category" name="categoryId">
            <option value="">Uncategorized</option>
            {categories.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Brand" name="brandId">
            <option value="">No brand</option>
            {brands.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Tax profile" name="taxProfileId">
            <option value="">No default tax</option>
            {taxes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </SelectField>
        </div>
        <label className="mt-5 flex gap-3 text-sm">
          <input type="checkbox" name="trackInventory" defaultChecked />
          Track in future inventory ledger
        </label>
      </section>
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Variant options</h2>
            <p className="text-sm text-subtle">
              Combinations are generated automatically.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setOptions((v) => [...v, { name: "", values: [""] }])
            }
          >
            Add option
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          {options.map((option, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
              <Field
                label="Option"
                value={option.name}
                onChange={(e) =>
                  setOptions((v) =>
                    v.map((x, i) =>
                      i === index ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <Field
                label="Values (comma separated)"
                value={option.values.join(", ")}
                onChange={(e) =>
                  setOptions((v) =>
                    v.map((x, i) =>
                      i === index
                        ? { ...x, values: e.target.value.split(",") }
                        : x,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setOptions((v) => v.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-muted p-4 text-sm">
          <strong>{combinations.length} variants:</strong>{" "}
          {combinations.map((x) => x.name).join(", ") || "Add valid options"}
        </div>
      </section>
      <Button disabled={pending || !combinations.length}>
        {pending ? "Creating variants..." : "Create variant product"}
      </Button>
    </form>
  );
}
