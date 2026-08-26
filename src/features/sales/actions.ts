"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { salesError } from "./errors";

export type SalesState = { success?: string; error?: string; id?: string };
const uuid = z.string().uuid();
const text = z.string().trim().max(2000);
const parseLines = (value: string) => {
  try {
    const lines: unknown = JSON.parse(value);
    if (!Array.isArray(lines) || lines.length === 0) return null;
    return lines;
  } catch {
    return null;
  }
};
const refresh = () => revalidatePath("/dashboard/sales", "layout");

export async function createCustomer(
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      code: z.string().trim().min(1).max(30),
      type: z.enum(["INDIVIDUAL", "BUSINESS"]),
      displayName: z.string().trim().min(2).max(200),
      legalName: text,
      firstName: text,
      lastName: text,
      email: z.string().trim().max(200),
      phone: z.string().trim().max(50),
      taxNumber: text,
      registrationNumber: text,
      currency: z.string().regex(/^[A-Z]{3}$/),
      priceListId: z.string(),
      paymentTerms: text,
      creditLimit: z.coerce.number().nonnegative(),
      notes: text,
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } =
    await requireOrganizationPermission("customers.create");
  const { data, error } = await client.rpc("create_customer", {
    target_organization_id: organization.id,
    target_customer: {
      customer_code: p.data.code,
      customer_type: p.data.type,
      display_name: p.data.displayName,
      legal_name: p.data.legalName,
      first_name: p.data.firstName,
      last_name: p.data.lastName,
      email: p.data.email,
      phone: p.data.phone,
      tax_number: p.data.taxNumber,
      registration_number: p.data.registrationNumber,
      default_currency: p.data.currency,
      default_price_list_id: p.data.priceListId || null,
      default_payment_terms: p.data.paymentTerms,
      credit_limit: p.data.creditLimit,
      notes: p.data.notes,
    },
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Customer created", id: data };
}

export async function addCustomerContact(
  customerId: string,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      name: z.string().trim().min(2),
      title: text,
      email: z.string().trim().max(200),
      phone: z.string().trim().max(50),
      primary: z.string().optional(),
      billing: z.string().optional(),
      delivery: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } =
    await requireOrganizationPermission("customers.update");
  const { error } = await client.rpc("add_customer_contact", {
    target_organization_id: organization.id,
    target_customer_id: customerId,
    target_contact: {
      ...p.data,
      is_primary: p.data.primary === "on",
      is_billing: p.data.billing === "on",
      is_delivery: p.data.delivery === "on",
    },
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Contact added" };
}
export async function addCustomerAddress(
  customerId: string,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      type: z.enum(["BILLING", "DELIVERY", "OFFICE", "HOME", "OTHER"]),
      line1: z.string().trim().min(2),
      line2: text,
      city: text,
      state: text,
      postalCode: text,
      countryCode: z.string().trim().min(2).max(3),
      defaultBilling: z.string().optional(),
      defaultDelivery: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } =
    await requireOrganizationPermission("customers.update");
  const { error } = await client.rpc("add_customer_address", {
    target_organization_id: organization.id,
    target_customer_id: customerId,
    target_address: {
      address_type: p.data.type,
      line_1: p.data.line1,
      line_2: p.data.line2,
      city: p.data.city,
      state_region: p.data.state,
      postal_code: p.data.postalCode,
      country_code: p.data.countryCode,
      is_default_billing: p.data.defaultBilling === "on",
      is_default_delivery: p.data.defaultDelivery === "on",
    },
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Address added" };
}

export async function createQuotation(
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      customerId: uuid,
      branchId: uuid,
      expiryDate: z.string(),
      priceListId: uuid,
      currency: z.string().regex(/^[A-Z]{3}$/),
      exchangeRate: z.coerce.number().positive(),
      billingAddress: text,
      deliveryAddress: text,
      notes: text,
      terms: text,
      linesJson: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const lines = parseLines(p.data.linesJson);
  if (!lines) return { error: "Add at least one valid Sales line." };
  const { client, organization, business } =
    await requireOrganizationPermission("sales.quotation_create");
  const { data, error } = await client.rpc("create_sales_quotation", {
    target_organization_id: organization.id,
    target_business_id: business.id,
    target_customer_id: p.data.customerId,
    target_branch_id: p.data.branchId,
    target_expiry_date: p.data.expiryDate || (null as never),
    target_price_list_id: p.data.priceListId,
    target_currency: p.data.currency,
    target_exchange_rate: p.data.exchangeRate,
    target_billing_address: p.data.billingAddress
      ? { formatted: p.data.billingAddress }
      : null,
    target_delivery_address: p.data.deliveryAddress
      ? { formatted: p.data.deliveryAddress }
      : null,
    target_lines: lines,
    target_notes: p.data.notes,
    target_terms: p.data.terms,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Quotation created", id: data };
}

export async function updateCustomer(
  customerId: string,
  canManageCredit: boolean,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      type: z.enum(["INDIVIDUAL", "BUSINESS"]),
      displayName: z.string().trim().min(2).max(200),
      legalName: text,
      firstName: text,
      lastName: text,
      email: z.string().trim().max(200),
      phone: z.string().trim().max(50),
      taxNumber: text,
      registrationNumber: text,
      currency: z.string().regex(/^[A-Z]{3}$/),
      priceListId: z.string(),
      paymentTerms: text,
      creditLimit: z.coerce.number().nonnegative(),
      creditStatus: z.enum(["GOOD", "ON_HOLD", "BLOCKED"]),
      status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
      notes: text,
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } =
    await requireOrganizationPermission("customers.update");
  const { error } = await client.rpc("update_customer", {
    target_organization_id: organization.id,
    target_customer_id: customerId,
    target_customer: {
      customer_type: p.data.type,
      display_name: p.data.displayName,
      legal_name: p.data.legalName,
      first_name: p.data.firstName,
      last_name: p.data.lastName,
      email: p.data.email,
      phone: p.data.phone,
      tax_number: p.data.taxNumber,
      registration_number: p.data.registrationNumber,
      default_currency: p.data.currency,
      default_price_list_id: p.data.priceListId || null,
      default_payment_terms: p.data.paymentTerms,
      credit_limit: canManageCredit ? p.data.creditLimit : undefined,
      credit_status: canManageCredit ? p.data.creditStatus : undefined,
      status: p.data.status,
      notes: p.data.notes,
    },
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Customer updated", id: customerId };
}

export async function updateQuotation(
  quotationId: string,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      expiryDate: z.string(),
      billingAddress: text,
      deliveryAddress: text,
      notes: text,
      terms: text,
      linesJson: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const lines = parseLines(p.data.linesJson);
  if (!lines) return { error: "Add at least one valid Sales line." };
  const { client, organization } = await requireOrganizationPermission(
    "sales.quotation_update",
  );
  const { error } = await client.rpc("update_sales_quotation", {
    target_organization_id: organization.id,
    target_quotation_id: quotationId,
    target_expiry_date: p.data.expiryDate,
    target_billing_address: p.data.billingAddress
      ? { formatted: p.data.billingAddress }
      : null,
    target_delivery_address: p.data.deliveryAddress
      ? { formatted: p.data.deliveryAddress }
      : null,
    target_lines: lines,
    target_notes: p.data.notes,
    target_terms: p.data.terms,
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Quotation updated", id: quotationId };
}
export async function transitionQuotation(
  id: string,
  action: "SUBMIT" | "APPROVE" | "REJECT" | "ACCEPT" | "CANCEL",
) {
  const permission = ["APPROVE", "REJECT"].includes(action)
    ? "sales.quotation_approve"
    : "sales.quotation_submit";
  const { client, organization } =
    await requireOrganizationPermission(permission);
  const { error } = await client.rpc("transition_sales_quotation", {
    target_organization_id: organization.id,
    target_quotation_id: id,
    target_action: action,
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
}
export async function convertQuotation(
  id: string,
  warehouseId: string,
  locationId: string,
) {
  const { client, organization } =
    await requireOrganizationPermission("sales.order_create");
  const { data, error } = await client.rpc("convert_quotation_to_sales_order", {
    target_organization_id: organization.id,
    target_quotation_id: id,
    target_warehouse_id: warehouseId,
    target_location_id: locationId,
    target_requested_delivery_date: null as never,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
  redirect(`/dashboard/sales/orders/${data}`);
}

export async function createOrder(
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({
      customerId: uuid,
      branchId: uuid,
      warehouseId: uuid,
      locationId: uuid,
      requestedDate: z.string(),
      priceListId: uuid,
      currency: z.string(),
      exchangeRate: z.coerce.number().positive(),
      billingAddress: text,
      deliveryAddress: text,
      notes: text,
      linesJson: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const lines = parseLines(p.data.linesJson);
  if (!lines) return { error: "Add at least one valid Sales line." };
  const { client, organization, business } =
    await requireOrganizationPermission("sales.order_create");
  const { data, error } = await client.rpc("create_sales_order", {
    target_organization_id: organization.id,
    target_business_id: business.id,
    target_customer_id: p.data.customerId,
    target_branch_id: p.data.branchId,
    target_warehouse_id: p.data.warehouseId,
    target_location_id: p.data.locationId,
    target_requested_delivery_date: p.data.requestedDate || (null as never),
    target_price_list_id: p.data.priceListId,
    target_currency: p.data.currency,
    target_exchange_rate: p.data.exchangeRate,
    target_billing_address: p.data.billingAddress
      ? { formatted: p.data.billingAddress }
      : null,
    target_delivery_address: p.data.deliveryAddress
      ? { formatted: p.data.deliveryAddress }
      : null,
    target_lines: lines,
    target_notes: p.data.notes,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Sales Order created", id: data };
}
export async function confirmOrder(
  id: string,
  allowBackorder: boolean,
  override = false,
) {
  const { client, organization } = await requireOrganizationPermission(
    "sales.order_confirm",
  );
  const { error } = await client.rpc("confirm_sales_order", {
    target_organization_id: organization.id,
    target_sales_order_id: id,
    target_allow_backorder: allowBackorder,
    target_credit_override: override,
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
}
export async function cancelOrder(id: string) {
  const { client, organization } =
    await requireOrganizationPermission("sales.order_cancel");
  const { error } = await client.rpc("cancel_sales_order", {
    target_organization_id: organization.id,
    target_sales_order_id: id,
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
}
export async function createFulfilment(
  orderId: string,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({ linesJson: z.string(), notes: text })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const lines = parseLines(p.data.linesJson);
  if (!lines) return { error: "Enter at least one fulfilment quantity." };
  const { client, organization } = await requireOrganizationPermission(
    "sales.fulfilment_create",
  );
  const { data, error } = await client.rpc("create_sales_fulfilment", {
    target_organization_id: organization.id,
    target_sales_order_id: orderId,
    target_lines: lines,
    target_fulfilled_at: new Date().toISOString(),
    target_notes: p.data.notes,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Draft fulfilment created", id: data };
}
export async function postFulfilment(id: string) {
  const { client, organization } = await requireOrganizationPermission(
    "sales.fulfilment_post",
  );
  const { error } = await client.rpc("post_sales_fulfilment", {
    target_organization_id: organization.id,
    target_fulfilment_id: id,
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
}
export async function createInvoice(
  orderId: string,
  fulfilmentIds: string[],
  form: FormData,
) {
  const parsed = z
    .object({ dueDate: z.string() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) throw new Error("Choose a valid due date.");
  const { client, organization } = await requireOrganizationPermission(
    "sales.invoice_create",
  );
  const { data, error } = await client.rpc("create_customer_invoice", {
    target_organization_id: organization.id,
    target_sales_order_id: orderId,
    target_fulfilment_ids: fulfilmentIds,
    target_invoice_date: new Date().toISOString().slice(0, 10),
    target_due_date: parsed.data.dueDate || (null as never),
    target_notes: "Created from posted fulfilment",
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
  redirect(`/dashboard/sales/invoices/${data}`);
}
export async function issueInvoice(id: string) {
  const { client, organization } = await requireOrganizationPermission(
    "sales.invoice_issue",
  );
  const { error } = await client.rpc("issue_customer_invoice", {
    target_organization_id: organization.id,
    target_invoice_id: id,
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
}
export async function createReturn(
  fulfilmentId: string,
  invoiceId: string | null,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({ reasonId: uuid, linesJson: z.string(), notes: text })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const lines = parseLines(p.data.linesJson);
  if (!lines) return { error: "Choose an eligible line and return quantity." };
  const { client, organization } = await requireOrganizationPermission(
    "sales.return_create",
  );
  const { data, error } = await client.rpc("create_sales_return", {
    target_organization_id: organization.id,
    target_fulfilment_id: fulfilmentId,
    target_invoice_id: invoiceId || (null as never),
    target_reason_id: p.data.reasonId,
    target_lines: lines,
    target_notes: p.data.notes,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Return request created", id: data };
}
export async function inspectReturn(
  id: string,
  _: SalesState,
  form: FormData,
): Promise<SalesState> {
  const p = z
    .object({ linesJson: z.string() })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const lines = parseLines(p.data.linesJson);
  if (!lines) return { error: "Record at least one inspected return line." };
  const { client, organization } = await requireOrganizationPermission(
    "sales.return_receive",
  );
  const { error } = await client.rpc("inspect_sales_return", {
    target_organization_id: organization.id,
    target_sales_return_id: id,
    target_lines: lines,
  });
  if (error) return { error: salesError(error.message) };
  refresh();
  return { success: "Inspection recorded" };
}
export async function postReturn(id: string) {
  const { client, organization } =
    await requireOrganizationPermission("sales.return_post");
  const { error } = await client.rpc("post_sales_return", {
    target_organization_id: organization.id,
    target_sales_return_id: id,
  });
  if (error) throw new Error(salesError(error.message));
  refresh();
}
