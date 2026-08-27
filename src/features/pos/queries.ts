import "server-only";
import { requireOrganizationPermission } from "@/features/organizations/context";

export async function posRegisterData() {
  const context = await requireOrganizationPermission("pos.access");
  const { client, organization, user } = context;
  const [
    { data: terminals },
    { data: sessions },
    { data: customers },
    { data: methods },
    { data: accounts },
    { data: held },
    { data: credits },
  ] = await Promise.all([
    client
      .from("pos_terminals")
      .select(
        "id,name,terminal_code,branch_id,default_customer_id,default_cash_account_id,branches(name)",
      )
      .eq("status", "ACTIVE")
      .order("name"),
    client
      .from("pos_sessions")
      .select("id,terminal_id,session_number,opening_float,opened_at")
      .eq("cashier_user_id", user.id)
      .eq("status", "OPEN"),
    client
      .from("customers")
      .select("id,display_name,customer_code,default_price_list_id")
      .eq("status", "ACTIVE")
      .order("display_name")
      .limit(500),
    client
      .from("payment_methods")
      .select(
        "id,name,method_type,branch_id,default_account_id,requires_reference",
      )
      .eq("status", "ACTIVE")
      .order("name"),
    client
      .from("payment_accounts")
      .select("id,name,account_type,currency,branch_id")
      .eq("status", "ACTIVE")
      .order("name"),
    client
      .from("pos_held_carts")
      .select("id,session_id,customer_id,cart,notes,held_at,expires_at")
      .eq("status", "HELD")
      .order("held_at", { ascending: false }),
    client
      .from("customer_unapplied_credit_documents")
      .select(
        "customer_id,source_id,source_type,document_number,currency,unapplied_amount",
      )
      .gt("unapplied_amount", 0),
  ]);
  return {
    ...context,
    terminals: terminals ?? [],
    sessions: sessions ?? [],
    customers: customers ?? [],
    methods: methods ?? [],
    accounts: accounts ?? [],
    held: held ?? [],
    credits: credits ?? [],
    currency: organization.currency_code,
  };
}

export async function posReceiptData(id: string) {
  const context = await requireOrganizationPermission("pos.access");
  const { data: receipt } = await context.client
    .from("pos_receipts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!receipt) return { ...context, receipt: null, lines: [] };
  const { data: lines } = await context.client
    .from("sales_order_lines")
    .select(
      "id,description_snapshot,ordered_quantity,unit_price,discount,tax,line_total,product_variants(name,sku,products(name)),product_variant_packaging(name)",
    )
    .eq("sales_order_id", receipt.sales_order_id!);
  return { ...context, receipt, lines: lines ?? [] };
}
