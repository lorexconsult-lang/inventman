import "server-only";
import { getOrganizationContext } from "@/features/organizations/context";

export async function salesFormData() {
  const context = await getOrganizationContext();
  const { client, organization } = context;
  const [
    { data: customers },
    { data: branches },
    { data: warehouses },
    { data: locations },
    { data: priceLists },
    { data: reasons },
  ] = await Promise.all([
    client
      .from("customers")
      .select(
        "id,customer_code,display_name,credit_limit,credit_status,default_price_list_id",
      )
      .eq("organization_id", organization.id)
      .eq("status", "ACTIVE")
      .order("display_name")
      .limit(100),
    client
      .from("branches")
      .select("id,name")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .order("name"),
    client
      .from("warehouses")
      .select("id,name,branch_id")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .order("name"),
    client
      .from("storage_locations")
      .select("id,name,warehouse_id,branch_id")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("price_lists")
      .select("id,name,currency_code,is_default")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("sales_return_reasons")
      .select("id,name,requires_notes")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
  ]);
  return {
    ...context,
    customers: customers ?? [],
    branches: branches ?? [],
    warehouses: warehouses ?? [],
    locations: locations ?? [],
    priceLists: priceLists ?? [],
    reasons: reasons ?? [],
  };
}

export async function salesPermissions() {
  const { client, organization } = await getOrganizationContext();
  const codes = [
    "customers.credit_manage",
    "sales.quotation_approve",
    "sales.order_confirm",
    "sales.order_cancel",
    "sales.fulfilment_post",
    "sales.invoice_issue",
    "sales.return_post",
    "sales.credit_note_approve",
    "sales.discount_override",
    "sales.price_override",
    "sales.credit_override",
    "receivables.view",
    "sales.reports_view",
  ];
  const entries = await Promise.all(
    codes.map(
      async (code) =>
        [
          code,
          Boolean(
            (
              await client.rpc("has_permission", {
                target_organization_id: organization.id,
                permission_code: code,
              })
            ).data,
          ),
        ] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<string, boolean>;
}
