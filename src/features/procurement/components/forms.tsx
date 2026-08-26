"use client";
import { useActionState, useEffect, useState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import {
  createPurchaseOrder,
  createRequisition,
  createSupplier,
  recordInvoice,
  type ProcurementState,
} from "../actions";
type Choice = { id: string; label: string };
type Variant = Choice & { packaging: Array<Choice> };
export function SupplierForm({ currency }: { currency: string }) {
  const [s, a, p] = useActionState<ProcurementState, FormData>(
    createSupplier,
    {},
  );
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-3"
    >
      <div className="md:col-span-3">
        <ActionFeedback {...s} />
      </div>
      <Field label="Supplier code" name="code" required />
      <SelectField label="Type" name="type">
        <option>MANUFACTURER</option>
        <option>DISTRIBUTOR</option>
        <option>WHOLESALER</option>
        <option>IMPORTER</option>
        <option>SERVICE_PROVIDER</option>
        <option>OTHER</option>
      </SelectField>
      <Field label="Legal name" name="legalName" required />
      <Field label="Trading name" name="tradingName" />
      <Field label="Email" name="email" type="email" />
      <Field label="Phone" name="phone" />
      <Field label="Currency" name="currency" defaultValue={currency} />
      <Field label="Payment terms" name="paymentTerms" />
      <div className="md:col-span-3">
        <TextareaField label="Notes" name="notes" />
      </div>
      <Button disabled={p}>Create supplier</Button>
    </form>
  );
}
function LineFields({
  variants,
  onValue,
}: {
  variants: Variant[];
  onValue: (value: string) => void;
}) {
  const [variant, setVariant] = useState("");
  const [packaging, setPackaging] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  useEffect(
    () =>
      onValue(
        JSON.stringify([
          {
            product_variant_id: variant,
            packaging_id: packaging,
            quantity,
            unit_price: unitPrice,
            discount: 0,
            tax: 0,
            notes: "",
          },
        ]),
      ),
    [variant, packaging, quantity, unitPrice, onValue],
  );
  return (
    <>
      <SelectField
        label="Product"
        value={variant}
        onChange={(e) => {
          setVariant(e.target.value);
          setPackaging("");
        }}
        required
      >
        <option value="">Select</option>
        {variants.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Packaging"
        value={packaging}
        onChange={(e) => setPackaging(e.target.value)}
        required
      >
        <option value="">Select</option>
        {variants
          .find((x) => x.id === variant)
          ?.packaging.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
      </SelectField>
      <Field
        label="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        inputMode="decimal"
        required
      />
      <Field
        label="Unit price"
        value={unitPrice}
        onChange={(e) => setUnitPrice(e.target.value)}
        inputMode="decimal"
        required
      />
    </>
  );
}
export function RequisitionForm({
  branches,
  variants,
}: {
  branches: Choice[];
  variants: Variant[];
}) {
  const [s, a, p] = useActionState<ProcurementState, FormData>(
    createRequisition,
    {},
  );
  const [json, setJson] = useState("[]");
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-4"
    >
      <input type="hidden" name="linesJson" value={json} />
      <div className="md:col-span-4">
        <ActionFeedback {...s} />
      </div>
      <SelectField label="Branch" name="branchId" required>
        <option value="">Select</option>
        {branches.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <Field label="Required by" name="requiredBy" type="date" />
      <SelectField label="Priority" name="priority">
        <option>NORMAL</option>
        <option>HIGH</option>
        <option>URGENT</option>
        <option>LOW</option>
      </SelectField>
      <Field label="Department" name="department" />
      <LineFields variants={variants} onValue={setJson} />
      <div className="md:col-span-4">
        <TextareaField label="Justification" name="justification" />
      </div>
      <Button disabled={p}>Create requisition</Button>
    </form>
  );
}
export function PurchaseOrderForm({
  suppliers,
  branches,
  warehouses,
  locations,
  variants,
  currency,
}: {
  suppliers: Choice[];
  branches: Choice[];
  warehouses: Array<Choice & { branchId: string }>;
  locations: Array<Choice & { warehouseId: string }>;
  variants: Variant[];
  currency: string;
}) {
  const [s, a, p] = useActionState<ProcurementState, FormData>(
    createPurchaseOrder,
    {},
  );
  const [json, setJson] = useState("[]");
  const [branch, setBranch] = useState("");
  const [warehouse, setWarehouse] = useState("");
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-4"
    >
      <input type="hidden" name="linesJson" value={json} />
      <div className="md:col-span-4">
        <ActionFeedback {...s} />
      </div>
      <SelectField label="Supplier" name="supplierId" required>
        <option value="">Select</option>
        {suppliers.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Branch"
        name="branchId"
        value={branch}
        onChange={(e) => {
          setBranch(e.target.value);
          setWarehouse("");
        }}
        required
      >
        <option value="">Select</option>
        {branches.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Warehouse"
        name="warehouseId"
        value={warehouse}
        onChange={(e) => setWarehouse(e.target.value)}
        required
      >
        <option value="">Select</option>
        {warehouses
          .filter((x) => x.branchId === branch)
          .map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
      </SelectField>
      <SelectField label="Location" name="locationId" required>
        <option value="">Select</option>
        {locations
          .filter((x) => x.warehouseId === warehouse)
          .map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
      </SelectField>
      <Field label="Order date" name="orderDate" type="date" required />
      <Field label="Expected date" name="expectedDate" type="date" />
      <Field label="Currency" name="currency" defaultValue={currency} />
      <Field label="Exchange rate" name="exchangeRate" defaultValue="1" />
      <LineFields variants={variants} onValue={setJson} />
      <Field label="Payment terms" name="paymentTerms" />
      <div className="md:col-span-4">
        <TextareaField label="Notes" name="notes" />
      </div>
      <Button disabled={p}>Create PO</Button>
    </form>
  );
}
export function InvoiceForm({
  suppliers,
  pos,
  grns,
  currency,
}: {
  suppliers: Choice[];
  pos: Choice[];
  grns: Choice[];
  currency: string;
}) {
  const [s, a, p] = useActionState<ProcurementState, FormData>(
    recordInvoice,
    {},
  );
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-4"
    >
      <div className="md:col-span-4">
        <ActionFeedback {...s} />
      </div>
      <SelectField label="Supplier" name="supplierId" required>
        <option value="">Select</option>
        {suppliers.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <Field label="Invoice number" name="invoiceNumber" required />
      <Field label="Invoice date" name="invoiceDate" type="date" required />
      <Field label="Due date" name="dueDate" type="date" />
      <SelectField label="Purchase order" name="poId">
        <option value="">None</option>
        {pos.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <SelectField label="GRN" name="grnId">
        <option value="">None</option>
        {grns.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <Field label="Currency" name="currency" defaultValue={currency} />
      <Field label="Exchange rate" name="exchangeRate" defaultValue="1" />
      <Field label="Subtotal" name="subtotal" defaultValue="0" />
      <Field label="Discount" name="discount" defaultValue="0" />
      <Field label="Tax" name="tax" defaultValue="0" />
      <Field label="Freight" name="freight" defaultValue="0" />
      <Field label="Total" name="total" defaultValue="0" />
      <div className="md:col-span-4">
        <TextareaField label="Notes" name="notes" />
      </div>
      <Button disabled={p}>Record invoice</Button>
    </form>
  );
}
