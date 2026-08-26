"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { procurementError } from "./calculations";
export type ProcurementState = {
  success?: string;
  error?: string;
  id?: string;
};
const uuid = z.string().uuid();
const text = z.string().trim().max(2000);
function refresh() {
  revalidatePath("/dashboard/procurement");
}
function lines(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Lines are malformed");
  }
}
export async function createSupplier(
  _: ProcurementState,
  form: FormData,
): Promise<ProcurementState> {
  const p = z
    .object({
      code: z.string().trim().min(1).max(30),
      type: z.enum([
        "MANUFACTURER",
        "DISTRIBUTOR",
        "WHOLESALER",
        "IMPORTER",
        "SERVICE_PROVIDER",
        "OTHER",
      ]),
      legalName: z.string().trim().min(2).max(200),
      tradingName: text,
      email: z.string().trim().max(200),
      phone: z.string().trim().max(50),
      currency: z.string().regex(/^[A-Z]{3}$/),
      paymentTerms: text,
      notes: text,
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } =
    await requireOrganizationPermission("suppliers.create");
  const { data, error } = await client.rpc("create_supplier", {
    target_organization_id: organization.id,
    target_code: p.data.code,
    target_type: p.data.type,
    target_legal_name: p.data.legalName,
    target_trading_name: p.data.tradingName,
    target_email: p.data.email,
    target_phone: p.data.phone,
    target_currency: p.data.currency,
    target_payment_terms: p.data.paymentTerms,
    target_notes: p.data.notes,
  });
  if (error) return { error: procurementError(error.message) };
  refresh();
  return { success: "Supplier created", id: data };
}
export async function addSupplierProduct(
  supplierId: string,
  _: ProcurementState,
  form: FormData,
): Promise<ProcurementState> {
  const p = z
    .object({
      variantId: uuid,
      packagingId: uuid,
      supplierSku: text,
      description: text,
      minimum: z.coerce.number().positive(),
      multiple: z.coerce.number().positive(),
      leadDays: z.coerce.number().int().nonnegative(),
      preferred: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } =
    await requireOrganizationPermission("suppliers.update");
  const { error } = await client.rpc("add_supplier_product", {
    target_organization_id: organization.id,
    target_supplier_id: supplierId,
    target_variant_id: p.data.variantId,
    target_packaging_id: p.data.packagingId,
    target_supplier_sku: p.data.supplierSku,
    target_description: p.data.description,
    target_minimum: p.data.minimum,
    target_multiple: p.data.multiple,
    target_lead_days: p.data.leadDays,
    target_preferred: p.data.preferred === "on",
  });
  if (error) return { error: procurementError(error.message) };
  refresh();
  return { success: "Supplier product added" };
}
export async function createRequisition(
  _: ProcurementState,
  form: FormData,
): Promise<ProcurementState> {
  const p = z
    .object({
      branchId: uuid,
      requiredBy: z.string(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
      department: text,
      justification: text,
      linesJson: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization, business } =
    await requireOrganizationPermission("procurement.requisition_create");
  const { data, error } = await client.rpc("create_purchase_requisition", {
    target_organization_id: organization.id,
    target_business_id: business.id,
    target_branch_id: p.data.branchId,
      target_required_by: p.data.requiredBy || (null as never),
    target_priority: p.data.priority,
    target_department: p.data.department,
    target_justification: p.data.justification,
    target_lines: lines(p.data.linesJson),
  });
  if (error) return { error: procurementError(error.message) };
  refresh();
  return { success: "Requisition created", id: data };
}
export async function submitRequisition(id: string) {
  const { client, organization } = await requireOrganizationPermission(
    "procurement.requisition_submit",
  );
  const { error } = await client.rpc("submit_purchase_requisition", {
    target_organization_id: organization.id,
    target_requisition_id: id,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) throw new Error(procurementError(error.message));
  refresh();
}
export async function approveRequest(id: string, action: "APPROVE" | "REJECT") {
  const { client, organization } = await requireOrganizationPermission(
    "procurement.requisition_approve",
  );
  const { error } = await client.rpc("act_on_approval", {
    target_organization_id: organization.id,
    target_approval_request_id: id,
    target_action: action,
    target_comments: "Application approval",
  });
  if (error) throw new Error(procurementError(error.message));
  refresh();
}
export async function createPurchaseOrder(
  _: ProcurementState,
  form: FormData,
): Promise<ProcurementState> {
  const p = z
    .object({
      supplierId: uuid,
      branchId: uuid,
      warehouseId: uuid,
      locationId: uuid,
      orderDate: z.string(),
      expectedDate: z.string(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      exchangeRate: z.coerce.number().positive(),
      paymentTerms: text,
      notes: text,
      linesJson: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization, business } =
    await requireOrganizationPermission("procurement.po_create");
  const { data, error } = await client.rpc("create_purchase_order", {
    target_organization_id: organization.id,
    target_business_id: business.id,
    target_supplier_id: p.data.supplierId,
    target_branch_id: p.data.branchId,
    target_warehouse_id: p.data.warehouseId,
    target_location_id: p.data.locationId,
    target_order_date: p.data.orderDate,
      target_expected_date: p.data.expectedDate || (null as never),
    target_currency: p.data.currency,
    target_exchange_rate: p.data.exchangeRate,
    target_payment_terms: p.data.paymentTerms,
    target_notes: p.data.notes,
    target_lines: lines(p.data.linesJson),
  });
  if (error) return { error: procurementError(error.message) };
  refresh();
  return { success: "Purchase order created", id: data };
}
export async function approvePurchaseOrder(id: string) {
  const { client, organization } = await requireOrganizationPermission(
    "procurement.po_approve",
  );
  const { error } = await client.rpc("approve_purchase_order", {
    target_organization_id: organization.id,
    target_purchase_order_id: id,
    target_idempotency_key: crypto.randomUUID(),
  });
  if (error) throw new Error(procurementError(error.message));
  refresh();
}
export async function postReceipt(
  poId: string,
  lineId: string,
  outstanding: string,
) {
  const { client, organization } = await requireOrganizationPermission(
    "procurement.receipt_post",
  );
  const { error } = await client.rpc("post_goods_receipt", {
    target_organization_id: organization.id,
    target_purchase_order_id: poId,
    target_supplier_delivery_note: "",
    target_received_at: new Date().toISOString(),
    target_notes: "Application goods receipt",
    target_idempotency_key: crypto.randomUUID(),
    target_allow_override: false,
    target_override_reason: "",
    target_lines: [
      {
        purchase_order_line_id: lineId,
        delivered_quantity: outstanding,
        accepted_quantity: outstanding,
        rejected_quantity: 0,
        damaged_quantity: 0,
      },
    ],
  });
  if (error) throw new Error(procurementError(error.message));
  refresh();
}
export async function recordInvoice(
  _: ProcurementState,
  form: FormData,
): Promise<ProcurementState> {
  const p = z
    .object({
      supplierId: uuid,
      invoiceNumber: z.string().trim().min(1),
      invoiceDate: z.string(),
      dueDate: z.string(),
      currency: z.string(),
      exchangeRate: z.coerce.number().positive(),
      subtotal: z.coerce.number().nonnegative(),
      discount: z.coerce.number().nonnegative(),
      tax: z.coerce.number().nonnegative(),
      freight: z.coerce.number().nonnegative(),
      total: z.coerce.number().nonnegative(),
      notes: text,
      poId: z.string(),
      grnId: z.string(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  const { client, organization } = await requireOrganizationPermission(
    "procurement.invoice_create",
  );
  const { data, error } = await client.rpc("record_supplier_invoice", {
    target_organization_id: organization.id,
    target_supplier_id: p.data.supplierId,
    target_invoice_number: p.data.invoiceNumber,
    target_invoice_date: p.data.invoiceDate,
      target_due_date: p.data.dueDate || (null as never),
    target_currency: p.data.currency,
    target_exchange_rate: p.data.exchangeRate,
    target_subtotal: p.data.subtotal,
    target_discount: p.data.discount,
    target_tax: p.data.tax,
    target_freight: p.data.freight,
    target_total: p.data.total,
    target_notes: p.data.notes,
    target_po_ids: p.data.poId ? [p.data.poId] : [],
    target_grn_ids: p.data.grnId ? [p.data.grnId] : [],
  });
  if (error) return { error: procurementError(error.message) };
  refresh();
  return { success: "Supplier invoice recorded", id: data };
}
