import "server-only";
import { getOrganizationContext } from "@/features/organizations/context";

export async function paymentFormData(kind: "CUSTOMER" | "SUPPLIER") {
  const context = await getOrganizationContext();
  const { client, organization } = context;
  const [{ data: branches }, { data: accounts }, { data: methods }, partyResult, invoiceResult] = await Promise.all([
    client.from("branches").select("id,name").eq("status", "active").order("name"),
    client.from("payment_accounts").select("id,name,currency,branch_id,account_type").eq("status", "ACTIVE").order("name"),
    client.from("payment_methods").select("id,name,branch_id,default_account_id,requires_reference,allows_overpayment").eq("status", "ACTIVE").order("name"),
    kind === "CUSTOMER"
      ? client.from("customers").select("id,display_name,default_currency").eq("status", "ACTIVE").order("display_name")
      : client.from("suppliers").select("id,legal_name,default_currency").eq("status", "ACTIVE").order("legal_name"),
    kind === "CUSTOMER"
      ? client.from("customer_invoice_settlement").select("id,invoice_number,customer_id,branch_id,currency,total,outstanding_base").gt("outstanding_base", 0).not("status", "in", "(DRAFT,VOID)").order("due_date")
      : client.from("supplier_invoice_settlement").select("id,invoice_number,supplier_id,currency,total,outstanding_base").gt("outstanding_base", 0).not("status", "in", "(DRAFT,VOID)").order("due_date"),
  ]);
  const parties = (partyResult.data ?? []).map((item) => ({
    id: item.id,
    label: "display_name" in item ? item.display_name : item.legal_name,
    currency: item.default_currency,
  }));
  const invoices = (invoiceResult.data ?? []).flatMap((item) =>
    item.id && item.invoice_number && item.currency && item.outstanding_base !== null
      ? [{ id: item.id, invoice_number: item.invoice_number, currency: item.currency, outstanding_base: item.outstanding_base }]
      : [],
  );
  return { ...context, branches: branches ?? [], accounts: accounts ?? [], methods: methods ?? [], parties, invoices, currency: organization.currency_code };
}

export async function paymentDetail(id: string, kind: "CUSTOMER" | "SUPPLIER") {
  const context = await getOrganizationContext();
  const { client } = context;
  const { data } = await client
    .from("payments")
    .select("*,payment_methods(name,method_type),payment_accounts(name,account_code),branches(name),customers(display_name),suppliers(legal_name),payment_allocations(id,allocated_amount,allocated_base_amount,allocation_date,is_reversal,customer_invoice_id,supplier_invoice_id,customer_invoices(invoice_number),supplier_invoices(invoice_number)),customer_refunds(id,refund_number,amount,status,refund_date)")
    .eq("id", id)
    .eq("counterparty_type", kind)
    .maybeSingle();
  return { ...context, payment: data };
}
