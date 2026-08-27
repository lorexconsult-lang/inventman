"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { paymentError } from "./errors";

const uuid = z.string().uuid();
const text = z.string().trim().max(1000);
const refresh = () => revalidatePath("/dashboard", "layout");
const allocations = (form: FormData) => [...form.entries()].flatMap(([key, value]) => {
  if (!key.startsWith("allocation:")) return [];
  const amount = Number(value);
  return amount > 0 ? [{ invoice_id: key.slice(11), amount }] : [];
});

export async function createSettlementAccount(form: FormData) {
  const parsed = z.object({ branchId: z.string(), code: z.string().trim().min(1).max(30), name: z.string().trim().min(2), type: z.enum(["CASH", "BANK", "CARD_CLEARING", "MOBILE_MONEY", "OTHER_CLEARING"]), currency: z.string().regex(/^[A-Z]{3}$/), description: text }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/dashboard/settings/payments?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid account")}`);
  const { client, organization } = await requireOrganizationPermission("payments.accounts.manage");
  const { error } = await client.rpc("create_payment_account", { target_organization_id: organization.id, target_branch_id: parsed.data.branchId || (null as never), target_account_code: parsed.data.code, target_name: parsed.data.name, target_account_type: parsed.data.type, target_currency: parsed.data.currency, target_description: parsed.data.description });
  if (error) redirect(`/dashboard/settings/payments?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect("/dashboard/settings/payments?account=created");
}

export async function createSettlementMethod(form: FormData) {
  const parsed = z.object({ branchId: z.string(), accountId: uuid, code: z.string().trim().min(1).max(30), name: z.string().trim().min(2), type: z.enum(["CASH", "BANK_TRANSFER", "CARD", "MOBILE_MONEY", "CHEQUE", "STORE_CREDIT", "OTHER"]), requiresReference: z.string().optional(), allowsOverpayment: z.string().optional(), requiresApproval: z.string().optional() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/dashboard/settings/payments?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid method")}`);
  const { client, organization } = await requireOrganizationPermission("payments.accounts.manage");
  const { error } = await client.rpc("create_payment_method", { target_organization_id: organization.id, target_branch_id: parsed.data.branchId || (null as never), target_default_account_id: parsed.data.accountId, target_code: parsed.data.code, target_name: parsed.data.name, target_method_type: parsed.data.type, target_requires_reference: parsed.data.requiresReference === "on", target_allows_overpayment: parsed.data.allowsOverpayment === "on", target_requires_approval: parsed.data.requiresApproval === "on" });
  if (error) redirect(`/dashboard/settings/payments?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect("/dashboard/settings/payments?method=created");
}

export async function updateSettlementAccount(accountId: string, form: FormData) {
  const parsed = z.object({ name: z.string().trim().min(2), status: z.enum(["ACTIVE", "INACTIVE"]), description: text }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/settings/payments?error=Invalid%20account%20update");
  const { client, organization } = await requireOrganizationPermission("payments.accounts.manage");
  const { error } = await client.rpc("update_payment_account", { target_organization_id: organization.id, target_account_id: accountId, target_name: parsed.data.name, target_status: parsed.data.status, target_description: parsed.data.description });
  if (error) redirect(`/dashboard/settings/payments?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect("/dashboard/settings/payments?account=updated");
}

export async function updateSettlementMethod(methodId: string, form: FormData) {
  const parsed = z.object({ name: z.string().trim().min(2), status: z.enum(["ACTIVE", "INACTIVE"]), requiresReference: z.string().optional(), allowsOverpayment: z.string().optional(), requiresApproval: z.string().optional() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/settings/payments?error=Invalid%20method%20update");
  const { client, organization } = await requireOrganizationPermission("payments.accounts.manage");
  const { error } = await client.rpc("update_payment_method", { target_organization_id: organization.id, target_method_id: methodId, target_name: parsed.data.name, target_status: parsed.data.status, target_requires_reference: parsed.data.requiresReference === "on", target_allows_overpayment: parsed.data.allowsOverpayment === "on", target_requires_approval: parsed.data.requiresApproval === "on" });
  if (error) redirect(`/dashboard/settings/payments?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect("/dashboard/settings/payments?method=updated");
}

async function postPayment(kind: "CUSTOMER" | "SUPPLIER", form: FormData) {
  const parsed = z.object({ partyId: uuid, branchId: uuid, paymentDate: z.string().min(1), currency: z.string().regex(/^[A-Z]{3}$/), exchangeRate: z.coerce.number().positive(), amount: z.coerce.number().positive(), methodId: uuid, accountId: uuid, reference: text, notes: text, idempotencyKey: uuid }).safeParse(Object.fromEntries(form));
  const base = kind === "CUSTOMER" ? "/dashboard/sales/payments" : "/dashboard/procurement/payments";
  if (!parsed.success) redirect(`${base}/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid payment")}`);
  const permission = kind === "CUSTOMER" ? "payments.customer.post" : "payments.supplier.post";
  const { client, organization } = await requireOrganizationPermission(permission);
  const args = { target_organization_id: organization.id, target_branch_id: parsed.data.branchId, target_payment_date: parsed.data.paymentDate, target_currency: parsed.data.currency, target_exchange_rate: parsed.data.exchangeRate, target_amount: parsed.data.amount, target_payment_method_id: parsed.data.methodId, target_settlement_account_id: parsed.data.accountId, target_external_reference: parsed.data.reference, target_notes: parsed.data.notes, target_allocations: allocations(form), target_idempotency_key: parsed.data.idempotencyKey };
  const result = kind === "CUSTOMER"
    ? await client.rpc("post_customer_payment", { ...args, target_customer_id: parsed.data.partyId })
    : await client.rpc("post_supplier_payment", { ...args, target_supplier_id: parsed.data.partyId });
  if (result.error) redirect(`${base}/new?error=${encodeURIComponent(paymentError(result.error.message))}`);
  refresh();
  const id = (result.data as { payment_id?: string } | null)?.payment_id;
  redirect(id ? `${base}/${id}` : base);
}

export async function postCustomerPayment(form: FormData) { return postPayment("CUSTOMER", form); }
export async function postSupplierPayment(form: FormData) { return postPayment("SUPPLIER", form); }

export async function allocatePayment(kind: "CUSTOMER" | "SUPPLIER", paymentId: string, form: FormData) {
  const permission = kind === "CUSTOMER" ? "payments.customer.allocate" : "payments.supplier.allocate";
  const { client, organization } = await requireOrganizationPermission(permission);
  const { error } = await client.rpc("allocate_existing_payment", { target_organization_id: organization.id, target_payment_id: paymentId, target_allocations: allocations(form) });
  const base = kind === "CUSTOMER" ? "/dashboard/sales/payments" : "/dashboard/procurement/payments";
  if (error) redirect(`${base}/${paymentId}?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect(`${base}/${paymentId}?allocated=1`);
}

export async function reversePayment(kind: "CUSTOMER" | "SUPPLIER", paymentId: string, form: FormData) {
  const parsed = z.object({ reason: z.string().trim().min(3) }).safeParse(Object.fromEntries(form));
  const base = kind === "CUSTOMER" ? "/dashboard/sales/payments" : "/dashboard/procurement/payments";
  if (!parsed.success) redirect(`${base}/${paymentId}?error=Enter%20a%20reversal%20reason`);
  const permission = kind === "CUSTOMER" ? "payments.customer.reverse" : "payments.supplier.reverse";
  const { client, organization } = await requireOrganizationPermission(permission);
  const { error } = await client.rpc("reverse_payment", { target_organization_id: organization.id, target_payment_id: paymentId, target_reason: parsed.data.reason, target_idempotency_key: crypto.randomUUID() });
  if (error) redirect(`${base}/${paymentId}?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect(`${base}/${paymentId}?reversed=1`);
}

export async function postRefund(paymentId: string, customerId: string, form: FormData) {
  const parsed = z.object({ branchId: uuid, date: z.string().min(1), currency: z.string().regex(/^[A-Z]{3}$/), exchangeRate: z.coerce.number().positive(), amount: z.coerce.number().positive(), methodId: uuid, accountId: uuid, reference: text, reason: z.string().trim().min(3) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/dashboard/sales/payments/${paymentId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid refund")}`);
  const { client, organization } = await requireOrganizationPermission("payments.refund.post");
  const { error } = await client.rpc("post_customer_refund", { target_organization_id: organization.id, target_customer_id: customerId, target_branch_id: parsed.data.branchId, target_source_payment_id: paymentId, target_source_credit_note_id: null as never, target_refund_date: parsed.data.date, target_currency: parsed.data.currency, target_exchange_rate: parsed.data.exchangeRate, target_amount: parsed.data.amount, target_payment_method_id: parsed.data.methodId, target_settlement_account_id: parsed.data.accountId, target_external_reference: parsed.data.reference, target_reason: parsed.data.reason, target_idempotency_key: crypto.randomUUID() });
  if (error) redirect(`/dashboard/sales/payments/${paymentId}?error=${encodeURIComponent(paymentError(error.message))}`);
  refresh(); redirect(`/dashboard/sales/payments/${paymentId}?refunded=1`);
}
