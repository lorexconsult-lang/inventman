"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { posError } from "./errors";

const uuid = z.string().uuid();
const go = (path: string, error?: string): never =>
  redirect(
    error ? `${path}?error=${encodeURIComponent(posError(error))}` : path,
  );
const refresh = () => revalidatePath("/dashboard", "layout");

export async function openSession(form: FormData) {
  const parsed = z
    .object({
      terminalId: uuid,
      openingFloat: z.coerce.number().min(0),
      notes: z.string().trim().max(500),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/dashboard/pos", "Invalid session");
  const { client, organization } =
    await requireOrganizationPermission("pos.session.open");
  const { error } = await client.rpc("open_pos_session", {
    target_organization_id: organization.id,
    target_terminal_id: parsed.data.terminalId,
    target_opening_float: parsed.data.openingFloat,
    target_notes: parsed.data.notes,
  });
  if (error) go("/dashboard/pos", error.message);
  refresh();
  go("/dashboard/pos");
}

export async function closeSession(sessionId: string, form: FormData) {
  const parsed = z
    .object({
      countedCash: z.coerce.number().min(0),
      notes: z.string().trim().max(500),
      varianceReason: z.string().trim().max(500),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/dashboard/pos/sessions", "Invalid count");
  const { client, organization } =
    await requireOrganizationPermission("pos.session.close");
  const { error } = await client.rpc("close_pos_session", {
    target_organization_id: organization.id,
    target_session_id: sessionId,
    target_counted_cash: parsed.data.countedCash,
    target_notes: parsed.data.notes,
    target_variance_reason: parsed.data.varianceReason,
  });
  if (error) go("/dashboard/pos/sessions", error.message);
  refresh();
  go("/dashboard/pos/sessions");
}

export async function cashEvent(
  sessionId: string,
  eventType: "CASH_IN" | "CASH_OUT" | "CASH_DROP",
  form: FormData,
) {
  const parsed = z
    .object({
      amount: z.coerce.number().positive(),
      reason: z.string().trim().min(3).max(500),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return go("/dashboard/pos/sessions", "Invalid cash event");
  const { client, organization } = await requireOrganizationPermission(
    `pos.cash.${eventType === "CASH_IN" ? "in" : eventType === "CASH_OUT" ? "out" : "drop"}`,
  );
  const { error } = await client.rpc("record_pos_cash_event", {
    target_organization_id: organization.id,
    target_session_id: sessionId,
    target_event_type: eventType,
    target_amount: parsed.data.amount,
    target_reason: parsed.data.reason,
  });
  if (error) go("/dashboard/pos/sessions", error.message);
  refresh();
  go("/dashboard/pos/sessions");
}

export async function holdCart(form: FormData) {
  const parsed = z
    .object({
      sessionId: uuid,
      customerId: z.string(),
      cart: z.string().min(2),
      notes: z.string().trim().max(500),
      cartId: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/dashboard/pos", "Invalid cart");
  const cart = JSON.parse(parsed.data.cart) as unknown;
  const { client, organization } =
    await requireOrganizationPermission("pos.hold");
  const { error } = await client.rpc("hold_pos_cart", {
    target_organization_id: organization.id,
    target_session_id: parsed.data.sessionId,
    target_customer_id: parsed.data.customerId || (null as never),
    target_cart: cart as never,
    target_notes: parsed.data.notes,
    target_cart_id: parsed.data.cartId || (null as never),
  });
  if (error) go("/dashboard/pos", error.message);
  refresh();
  go("/dashboard/pos?held=1");
}

export async function completeSale(form: FormData) {
  const parsed = z
    .object({
      sessionId: uuid,
      customerId: uuid,
      lines: z.string().min(2),
      settlements: z.string().min(2),
      customerCreditAmount: z.coerce.number().min(0),
      cashTendered: z.coerce.number().min(0),
      notes: z.string().trim().max(500),
      heldCartId: z.string(),
      idempotencyKey: uuid,
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/dashboard/pos", "Invalid checkout");
  const { client, organization } =
    await requireOrganizationPermission("pos.sale.create");
  const { data, error } = await client.rpc("post_pos_sale", {
    target_organization_id: organization.id,
    target_session_id: parsed.data.sessionId,
    target_customer_id: parsed.data.customerId,
    target_lines: JSON.parse(parsed.data.lines),
    target_settlements: JSON.parse(parsed.data.settlements),
    target_customer_credit_amount: parsed.data.customerCreditAmount,
    target_cash_tendered: parsed.data.cashTendered,
    target_notes: parsed.data.notes,
    target_held_cart_id: parsed.data.heldCartId || (null as never),
    target_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) go("/dashboard/pos", error.message);
  refresh();
  const sale = (data as { pos_sale_id?: string } | null)?.pos_sale_id;
  go(sale ? `/dashboard/pos/receipts/${sale}` : "/dashboard/pos/receipts");
}

export async function reprintReceipt(saleId: string, form: FormData) {
  const reason = String(form.get("reason") ?? "").trim();
  if (reason.length < 3)
    go(`/dashboard/pos/receipts/${saleId}`, "Invalid reason");
  const { client, organization } = await requireOrganizationPermission(
    "pos.receipt.reprint",
  );
  const { error } = await client.rpc("record_pos_receipt_reprint", {
    target_organization_id: organization.id,
    target_sale_id: saleId,
    target_reason: reason,
  });
  if (error) go(`/dashboard/pos/receipts/${saleId}`, error.message);
  refresh();
  go(`/dashboard/pos/receipts/${saleId}?print=1`);
}

export async function createTerminal(form: FormData) {
  const parsed = z
    .object({
      branchId: uuid,
      code: z.string().trim().min(1).max(30),
      name: z.string().trim().min(2).max(100),
      warehouseId: uuid,
      locationId: uuid,
      customerId: z.string(),
      accountId: uuid,
      receiptWidth: z.enum(["58MM", "80MM", "A4"]),
      receiptFooter: z.string().trim().max(500),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/dashboard/settings/pos", "Invalid terminal");
  const { client, organization } = await requireOrganizationPermission(
    "pos.terminal.manage",
  );
  const { error } = await client.rpc("create_pos_terminal", {
    target_organization_id: organization.id,
    target_branch_id: parsed.data.branchId,
    target_code: parsed.data.code,
    target_name: parsed.data.name,
    target_warehouse_id: parsed.data.warehouseId,
    target_location_id: parsed.data.locationId,
    target_customer_id: parsed.data.customerId || (null as never),
    target_cash_account_id: parsed.data.accountId,
    target_receipt_width: parsed.data.receiptWidth,
    target_receipt_footer: parsed.data.receiptFooter,
  });
  if (error) go("/dashboard/settings/pos", error.message);
  refresh();
  go("/dashboard/settings/pos?terminal=created");
}

export async function updatePosSettings(form: FormData) {
  const parsed = z
    .object({
      requireCustomer: z.string().optional(),
      allowWalkIn: z.string().optional(),
      allowDiscounts: z.string().optional(),
      discountThreshold: z.coerce.number().min(0).max(100),
      varianceTolerance: z.coerce.number().min(0),
      holdMinutes: z.coerce.number().int().min(5).max(10080),
      returnPolicy: z.string().trim().max(2000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/dashboard/settings/pos", "Invalid settings");
  const { client, organization } = await requireOrganizationPermission(
    "pos.terminal.manage",
  );
  const { error } = await client.rpc("update_pos_settings", {
    target_organization_id: organization.id,
    target_require_customer: parsed.data.requireCustomer === "on",
    target_allow_walk_in: parsed.data.allowWalkIn === "on",
    target_allow_discounts: parsed.data.allowDiscounts === "on",
    target_discount_threshold_percent: parsed.data.discountThreshold,
    target_cash_variance_tolerance: parsed.data.varianceTolerance,
    target_hold_expiration_minutes: parsed.data.holdMinutes,
    target_return_policy: parsed.data.returnPolicy,
  });
  if (error) go("/dashboard/settings/pos", error.message);
  refresh();
  go("/dashboard/settings/pos?saved=1");
}
