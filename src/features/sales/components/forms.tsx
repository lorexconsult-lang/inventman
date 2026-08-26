"use client";
import { useActionState, useState } from "react";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import {
  addCustomerAddress,
  addCustomerContact,
  createCustomer,
  createFulfilment,
  createOrder,
  createQuotation,
  createReturn,
  inspectReturn,
  updateCustomer,
  updateQuotation,
  type SalesState,
} from "../actions";
import { SalesLineEntry, type SalesLine } from "./sales-line-entry";
type Choice = { id: string; label: string };
type Customer = Choice & { priceListId: string | null };
type Place = Choice & { branchId?: string; warehouseId?: string };
export function CustomerForm({
  currency,
  priceLists,
}: {
  currency: string;
  priceLists: Choice[];
}) {
  const [s, a, p] = useActionState<SalesState, FormData>(createCustomer, {});
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-3"
    >
      <div className="md:col-span-3">
        <ActionFeedback {...s} />
      </div>
      <Field label="Customer code" name="code" required />
      <SelectField label="Customer type" name="type">
        <option>BUSINESS</option>
        <option>INDIVIDUAL</option>
      </SelectField>
      <Field label="Display name" name="displayName" required />
      <Field label="Legal name" name="legalName" />
      <Field label="First name" name="firstName" />
      <Field label="Last name" name="lastName" />
      <Field label="Email" name="email" type="email" />
      <Field label="Phone" name="phone" />
      <Field label="Tax number" name="taxNumber" />
      <Field label="Registration number" name="registrationNumber" />
      <Field label="Currency" name="currency" defaultValue={currency} />
      <SelectField label="Price list" name="priceListId">
        <option value="">Organization default</option>
        {priceLists.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <Field label="Payment terms" name="paymentTerms" />
      <Field
        label="Credit limit"
        name="creditLimit"
        defaultValue="0"
        type="number"
        min="0"
      />
      <div className="md:col-span-3">
        <TextareaField label="Notes" name="notes" />
      </div>
      <Button disabled={p}>Create customer</Button>
    </form>
  );
}
export function CustomerEditForm({
  customerId,
  customer,
  currency,
  priceLists,
  canManageCredit,
}: {
  customerId: string;
  customer: {
    customer_type: string;
    display_name: string;
    legal_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    tax_number: string | null;
    registration_number: string | null;
    default_currency: string;
    default_price_list_id: string | null;
    default_payment_terms: string | null;
    credit_limit: number;
    credit_status: string;
    status: string;
    notes: string | null;
  };
  currency: string;
  priceLists: Choice[];
  canManageCredit: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateCustomer.bind(null, customerId, canManageCredit),
    {},
  );
  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-3"
    >
      <div className="md:col-span-3">
        <ActionFeedback {...state} />
      </div>
      <SelectField
        label="Customer type"
        name="type"
        defaultValue={customer.customer_type}
      >
        <option>BUSINESS</option>
        <option>INDIVIDUAL</option>
      </SelectField>
      <Field
        label="Display name"
        name="displayName"
        defaultValue={customer.display_name}
        required
      />
      <Field
        label="Legal name"
        name="legalName"
        defaultValue={customer.legal_name ?? ""}
      />
      <Field
        label="First name"
        name="firstName"
        defaultValue={customer.first_name ?? ""}
      />
      <Field
        label="Last name"
        name="lastName"
        defaultValue={customer.last_name ?? ""}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={customer.email ?? ""}
      />
      <Field label="Phone" name="phone" defaultValue={customer.phone ?? ""} />
      <Field
        label="Tax number"
        name="taxNumber"
        defaultValue={customer.tax_number ?? ""}
      />
      <Field
        label="Registration number"
        name="registrationNumber"
        defaultValue={customer.registration_number ?? ""}
      />
      <Field
        label="Currency"
        name="currency"
        defaultValue={customer.default_currency || currency}
      />
      <SelectField
        label="Price list"
        name="priceListId"
        defaultValue={customer.default_price_list_id ?? ""}
      >
        <option value="">Organization default</option>
        {priceLists.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <Field
        label="Payment terms"
        name="paymentTerms"
        defaultValue={customer.default_payment_terms ?? ""}
      />
      <Field
        label="Credit limit"
        name="creditLimit"
        type="number"
        min="0"
        defaultValue={customer.credit_limit}
        disabled={!canManageCredit}
      />
      <SelectField
        label="Credit status"
        name="creditStatus"
        defaultValue={customer.credit_status}
        disabled={!canManageCredit}
      >
        <option>NORMAL</option>
        <option>ON_HOLD</option>
        <option>BLOCKED</option>
      </SelectField>
      <SelectField label="Status" name="status" defaultValue={customer.status}>
        <option>ACTIVE</option>
        <option>INACTIVE</option>
        <option>ARCHIVED</option>
      </SelectField>
      <div className="md:col-span-3">
        <TextareaField
          label="Notes"
          name="notes"
          defaultValue={customer.notes ?? ""}
        />
      </div>
      <Button disabled={pending}>
        {pending ? "Saving..." : "Save customer"}
      </Button>
    </form>
  );
}
export function ContactForm({ customerId }: { customerId: string }) {
  const [s, a, p] = useActionState(
    addCustomerContact.bind(null, customerId),
    {},
  );
  return (
    <form
      action={a}
      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <ActionFeedback {...s} />
      </div>
      <Field label="Name" name="name" required />
      <Field label="Title" name="title" />
      <Field label="Email" name="email" type="email" />
      <Field label="Phone" name="phone" />
      <label>
        <input type="checkbox" name="primary" /> Primary
      </label>
      <label>
        <input type="checkbox" name="billing" /> Billing
      </label>
      <label>
        <input type="checkbox" name="delivery" /> Delivery
      </label>
      <Button disabled={p}>Add contact</Button>
    </form>
  );
}
export function AddressForm({ customerId }: { customerId: string }) {
  const [s, a, p] = useActionState(
    addCustomerAddress.bind(null, customerId),
    {},
  );
  return (
    <form
      action={a}
      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <ActionFeedback {...s} />
      </div>
      <SelectField label="Type" name="type">
        {["BILLING", "DELIVERY", "OFFICE", "HOME", "OTHER"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </SelectField>
      <Field label="Address line 1" name="line1" required />
      <Field label="Address line 2" name="line2" />
      <Field label="City" name="city" />
      <Field label="State / region" name="state" />
      <Field label="Postcode" name="postalCode" />
      <Field label="Country code" name="countryCode" required />
      <label>
        <input type="checkbox" name="defaultBilling" /> Default billing
      </label>
      <label>
        <input type="checkbox" name="defaultDelivery" /> Default delivery
      </label>
      <Button disabled={p}>Add address</Button>
    </form>
  );
}
function SaleDocumentForm({
  kind,
  customers,
  branches,
  warehouses,
  locations,
  priceLists,
  currency,
}: {
  kind: "quotation" | "order";
  customers: Customer[];
  branches: Choice[];
  warehouses: Place[];
  locations: Place[];
  priceLists: Choice[];
  currency: string;
}) {
  const action = kind === "quotation" ? createQuotation : createOrder;
  const [s, a, p] = useActionState<SalesState, FormData>(action, {});
  const [branch, setBranch] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [priceList, setPriceList] = useState(priceLists[0]?.id ?? "");
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-4"
    >
      <div className="md:col-span-full">
        <ActionFeedback {...s} />
      </div>
      <SelectField label="Customer" name="customerId" required>
        <option value="">Select</option>
        {customers.map((x) => (
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
        label="Price list"
        name="priceListId"
        value={priceList}
        onChange={(e) => setPriceList(e.target.value)}
        required
      >
        {priceLists.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <Field label="Currency" name="currency" defaultValue={currency} />
      <Field
        label="Exchange rate"
        name="exchangeRate"
        defaultValue="1"
        type="number"
        step="any"
      />
      {kind === "quotation" ? (
        <Field label="Expiry date" name="expiryDate" type="date" />
      ) : (
        <>
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
          <SelectField label="Storage location" name="locationId" required>
            <option value="">Select</option>
            {locations
              .filter((x) => x.warehouseId === warehouse)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
          </SelectField>
          <Field label="Requested date" name="requestedDate" type="date" />
        </>
      )}
      <SalesLineEntry branchId={branch} priceListId={priceList} />
      <TextareaField label="Billing address" name="billingAddress" />
      <TextareaField label="Delivery address" name="deliveryAddress" />
      <TextareaField label="Notes" name="notes" />
      {kind === "quotation" && <TextareaField label="Terms" name="terms" />}
      <Button disabled={p}>Create {kind}</Button>
    </form>
  );
}
export const QuotationForm = (
  p: Omit<
    Parameters<typeof SaleDocumentForm>[0],
    "kind" | "warehouses" | "locations"
  >,
) => (
  <SaleDocumentForm {...p} kind="quotation" warehouses={[]} locations={[]} />
);
export const OrderForm = (
  p: Omit<Parameters<typeof SaleDocumentForm>[0], "kind">,
) => <SaleDocumentForm {...p} kind="order" />;

export function QuotationEditForm({
  quotationId,
  branchId,
  priceListId,
  expiryDate,
  billingAddress,
  deliveryAddress,
  notes,
  terms,
  lines,
}: {
  quotationId: string;
  branchId: string;
  priceListId: string;
  expiryDate: string | null;
  billingAddress: string;
  deliveryAddress: string;
  notes: string | null;
  terms: string | null;
  lines: SalesLine[];
}) {
  const [state, action, pending] = useActionState(
    updateQuotation.bind(null, quotationId),
    {},
  );
  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <ActionFeedback {...state} />
      </div>
      <Field
        label="Expiry date"
        name="expiryDate"
        type="date"
        defaultValue={expiryDate ?? ""}
      />
      <SalesLineEntry
        branchId={branchId}
        priceListId={priceListId}
        initialLines={lines}
      />
      <TextareaField
        label="Billing address"
        name="billingAddress"
        defaultValue={billingAddress}
      />
      <TextareaField
        label="Delivery address"
        name="deliveryAddress"
        defaultValue={deliveryAddress}
      />
      <TextareaField label="Notes" name="notes" defaultValue={notes ?? ""} />
      <TextareaField label="Terms" name="terms" defaultValue={terms ?? ""} />
      <Button disabled={pending}>
        {pending ? "Saving..." : "Save draft quotation"}
      </Button>
    </form>
  );
}
export function FulfilmentForm({
  orderId,
  lines,
}: {
  orderId: string;
  lines: Array<{
    id: string;
    label: string;
    remaining: number;
    reserved: number;
  }>;
}) {
  const [s, a, p] = useActionState(createFulfilment.bind(null, orderId), {});
  const [qty, setQty] = useState<Record<string, string>>({});
  const json = JSON.stringify(
    lines
      .filter((x) => Number(qty[x.id]) > 0)
      .map((x) => ({ sales_order_line_id: x.id, quantity: Number(qty[x.id]) })),
  );
  return (
    <form action={a} className="space-y-4 rounded-2xl border p-5">
      <input type="hidden" name="linesJson" value={json} />
      <ActionFeedback {...s} />
      {lines.map((x) => (
        <label
          key={x.id}
          className="grid items-center gap-3 sm:grid-cols-[1fr_12rem]"
        >
          <span>
            {x.label}
            <small className="block text-subtle">
              Reserved {x.reserved} · remaining {x.remaining}
            </small>
          </span>
          <input
            aria-label={`Fulfil ${x.label}`}
            type="number"
            min="0"
            max={Math.min(x.remaining, x.reserved)}
            step="any"
            value={qty[x.id] ?? ""}
            onChange={(e) => setQty((v) => ({ ...v, [x.id]: e.target.value }))}
            className="min-h-11 rounded-xl border px-3"
          />
        </label>
      ))}
      <TextareaField label="Delivery notes" name="notes" />
      <Button disabled={p}>Create draft fulfilment</Button>
    </form>
  );
}
export function ReturnForm({
  fulfilmentId,
  invoiceId,
  reasons,
  lines,
}: {
  fulfilmentId: string;
  invoiceId: string | null;
  reasons: Choice[];
  lines: Array<{
    id: string;
    label: string;
    eligible: number;
    priorReturned?: number;
    conversion: number;
  }>;
}) {
  const [s, a, p] = useActionState(
    createReturn.bind(null, fulfilmentId, invoiceId),
    {},
  );
  const [line, setLine] = useState(lines[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  return (
    <form
      action={a}
      className="grid gap-4 rounded-2xl border p-5 md:grid-cols-2"
    >
      <input
        type="hidden"
        name="linesJson"
        value={JSON.stringify([
          { sales_fulfillment_line_id: line, quantity: Number(qty) },
        ])}
      />
      <div className="md:col-span-2">
        <ActionFeedback {...s} />
      </div>
      <SelectField
        label="Sold line"
        value={line}
        onChange={(e) => setLine(e.target.value)}
      >
        {lines.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label} · eligible {x.eligible / x.conversion} · previously
            returned {(x.priorReturned ?? 0) / x.conversion}
          </option>
        ))}
      </SelectField>
      <Field
        label="Return quantity"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        type="number"
        min="0"
        step="any"
      />
      <SelectField label="Reason" name="reasonId">
        {reasons.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Notes" name="notes" />
      <Button disabled={p}>Create return request</Button>
    </form>
  );
}
export function InspectionForm({
  returnId,
  lineId,
  locations,
}: {
  returnId: string;
  lineId: string;
  locations: Choice[];
}) {
  const [s, a, p] = useActionState(inspectReturn.bind(null, returnId), {});
  const [received, setReceived] = useState("0"),
    [accepted, setAccepted] = useState("0"),
    [rejected, setRejected] = useState("0"),
    [disposition, setDisposition] = useState("RESTOCK_NORMAL"),
    [location, setLocation] = useState("");
  return (
    <form
      action={a}
      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3"
    >
      <input
        type="hidden"
        name="linesJson"
        value={JSON.stringify([
          {
            sales_return_line_id: lineId,
            received_quantity: Number(received),
            accepted_quantity: Number(accepted),
            rejected_quantity: Number(rejected),
            disposition,
            destination_location_id: location || null,
          },
        ])}
      />
      <ActionFeedback {...s} />
      <Field
        label="Received"
        value={received}
        onChange={(e) => setReceived(e.target.value)}
        type="number"
      />
      <Field
        label="Accepted"
        value={accepted}
        onChange={(e) => setAccepted(e.target.value)}
        type="number"
      />
      <Field
        label="Rejected"
        value={rejected}
        onChange={(e) => setRejected(e.target.value)}
        type="number"
      />
      <SelectField
        label="Disposition"
        value={disposition}
        onChange={(e) => setDisposition(e.target.value)}
      >
        <option>RESTOCK_NORMAL</option>
        <option>RESTOCK_DAMAGED</option>
        <option>REJECT_RETURN</option>
      </SelectField>
      {disposition !== "REJECT_RETURN" && (
        <SelectField
          label="Destination"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">Select</option>
          {locations.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </SelectField>
      )}
      <Button disabled={p}>Record inspection</Button>
    </form>
  );
}
