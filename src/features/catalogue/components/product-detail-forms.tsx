"use client";
import { useActionState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import {
  addBarcode,
  addPackaging,
  addProductPrice,
  updateProduct,
  uploadProductImage,
  type CatalogueActionState,
} from "../actions";
type Choice = { id: string; name: string };
const initial: CatalogueActionState = {};
export function ProductEditForm({
  product,
  categories,
  brands,
  taxes,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    brand_id: string | null;
    tax_profile_id: string | null;
    reference_cost: number | null;
  };
  categories: Choice[];
  brands: Choice[];
  taxes: Choice[];
}) {
  const [s, a, p] = useActionState(updateProduct, initial);
  return (
    <form action={a} className="space-y-4">
      <input type="hidden" name="productId" value={product.id} />
      <ActionFeedback {...s} />
      <Field label="Name" name="name" defaultValue={product.name} required />
      <TextareaField
        label="Description"
        name="description"
        defaultValue={product.description ?? ""}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          label="Category"
          name="categoryId"
          defaultValue={product.category_id ?? ""}
        >
          <option value="">Uncategorized</option>
          {categories.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Brand"
          name="brandId"
          defaultValue={product.brand_id ?? ""}
        >
          <option value="">No brand</option>
          {brands.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Tax"
          name="taxProfileId"
          defaultValue={product.tax_profile_id ?? ""}
        >
          <option value="">No tax</option>
          {taxes.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </SelectField>
      </div>
      <Field
        label="Reference cost"
        name="referenceCost"
        type="number"
        min="0"
        step="0.0001"
        defaultValue={product.reference_cost ?? ""}
      />
      <Button disabled={p}>{p ? "Saving..." : "Save details"}</Button>
    </form>
  );
}
export function PackagingForm({
  variantId,
  units,
}: {
  variantId: string;
  units: Array<Choice & { symbol: string }>;
}) {
  const [s, a, p] = useActionState(addPackaging, initial);
  return (
    <form action={a} className="grid gap-4 md:grid-cols-4">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="md:col-span-4">
        <ActionFeedback {...s} />
      </div>
      <Field label="Package name" name="name" required />
      <SelectField label="Unit" name="unitId" required>
        <option value="">Select</option>
        {units.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name} ({x.symbol})
          </option>
        ))}
      </SelectField>
      <Field
        label="Units in base"
        name="conversionToBase"
        type="number"
        min="0.000001"
        step="0.000001"
        required
      />
      <div className="flex items-end gap-3">
        <label className="text-sm">
          <input name="canSell" type="checkbox" defaultChecked /> Sell
        </label>
        <label className="text-sm">
          <input name="canPurchase" type="checkbox" defaultChecked /> Buy
        </label>
      </div>
      <Button disabled={p}>Add package</Button>
    </form>
  );
}
export function BarcodeForm({
  variantId,
  packages,
}: {
  variantId: string;
  packages: Choice[];
}) {
  const [s, a, p] = useActionState(addBarcode, initial);
  return (
    <form action={a} className="grid gap-4 md:grid-cols-4">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="md:col-span-4">
        <ActionFeedback {...s} />
      </div>
      <Field label="Barcode" name="barcode" required />
      <SelectField label="Type" name="barcodeType">
        <option>EAN13</option>
        <option>UPC_A</option>
        <option>CODE128</option>
        <option>GTIN</option>
        <option>CUSTOM</option>
      </SelectField>
      <SelectField label="Packaging" name="packagingId">
        <option value="">Variant</option>
        {packages.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </SelectField>
      <label className="flex items-end gap-2 pb-3 text-sm">
        <input name="isPrimary" type="checkbox" /> Primary
      </label>
      <Button disabled={p}>Add barcode</Button>
    </form>
  );
}
export function PriceForm({
  variantId,
  packages,
  priceLists,
  branches,
}: {
  variantId: string;
  packages: Choice[];
  priceLists: Array<Choice & { currency_code: string }>;
  branches: Choice[];
}) {
  const [s, a, p] = useActionState(addProductPrice, initial);
  return (
    <form action={a} className="grid gap-4 md:grid-cols-5">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="md:col-span-5">
        <ActionFeedback {...s} />
      </div>
      <SelectField label="Package" name="packagingId" required>
        {packages.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="Price list" name="priceListId" required>
        {priceLists.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name} ({x.currency_code})
          </option>
        ))}
      </SelectField>
      <SelectField label="Branch" name="branchId">
        <option value="">All branches</option>
        {branches.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </SelectField>
      <Field
        label="Minimum quantity"
        name="minQuantity"
        type="number"
        min="0.000001"
        defaultValue="1"
      />
      <Field
        label="Amount"
        name="amount"
        type="number"
        min="0"
        step="0.0001"
        required
      />
      <Button disabled={p}>Add price</Button>
    </form>
  );
}
export function ImageUploadForm({ productId }: { productId: string }) {
  const [s, a, p] = useActionState(uploadProductImage, initial);
  return (
    <form action={a} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="productId" value={productId} />
      <div className="sm:col-span-3">
        <ActionFeedback {...s} />
      </div>
      <Field
        label="Image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
      />
      <Field label="Alt text" name="altText" />
      <Button disabled={p} className="self-end">
        {p ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
