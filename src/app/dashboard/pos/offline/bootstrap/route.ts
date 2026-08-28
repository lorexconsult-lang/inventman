import { appConfig } from "@/config/app";
import {
  getEffectivePermissions,
  requireOrganizationPermission,
} from "@/features/organizations/context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const terminalId = new URL(request.url).searchParams.get("terminalId");
  if (!terminalId)
    return Response.json({ error: "OFFLINE_TERMINAL_REQUIRED" }, { status: 400 });
  const { client, organization, user } =
    await requireOrganizationPermission("offline.use");
  const { data: terminal } = await client
    .from("pos_terminals")
    .select("id,name,status,branch_id,branches(name),default_customer_id")
    .eq("organization_id", organization.id)
    .eq("id", terminalId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!terminal)
    return Response.json({ error: "SYNC_TERMINAL_REVOKED" }, { status: 403 });
  const permissions = await getEffectivePermissions(organization.id);
  const [
    { data: session },
    { data: settings },
    { data: customers },
    { data: methods },
    { data: accounts },
    { data: variants },
    { data: priceLists },
  ] = await Promise.all([
    client
      .from("pos_sessions")
      .select("id,cashier_user_id,opened_at")
      .eq("organization_id", organization.id)
      .eq("terminal_id", terminal.id)
      .eq("cashier_user_id", user.id)
      .eq("status", "OPEN")
      .maybeSingle(),
    client
      .from("pos_settings")
      .select("*")
      .eq("organization_id", organization.id)
      .single(),
    client
      .from("customers")
      .select(
        "id,display_name,customer_code,phone,email,status,credit_status,credit_limit,default_price_list_id,updated_at",
      )
      .eq("organization_id", organization.id)
      .eq("status", "ACTIVE")
      .limit(1000),
    client
      .from("payment_methods")
      .select(
        "id,name,method_type,branch_id,default_account_id,requires_reference,status",
      )
      .eq("organization_id", organization.id)
      .eq("status", "ACTIVE"),
    client
      .from("payment_accounts")
      .select("id,name,account_type,currency,branch_id,status")
      .eq("organization_id", organization.id)
      .eq("status", "ACTIVE"),
    client
      .from("product_variants")
      .select(
        "id,name,sku,internal_code,updated_at,products!inner(name,status,tax_profiles(rate)),product_variant_packaging!inner(id,name,conversion_to_base,can_sell),product_barcodes(barcode,packaging_id)",
      )
      .eq("organization_id", organization.id)
      .eq("status", "ACTIVE")
      .eq("products.status", "ACTIVE")
      .eq("product_variant_packaging.can_sell", true)
      .limit(2000),
    client
      .from("price_lists")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("is_default", true)
      .eq("is_active", true)
      .limit(1),
  ]);
  if (!session || !settings)
    return Response.json({ error: "SYNC_SESSION_INVALID" }, { status: 409 });
  const offlineSettings = settings as typeof settings & {
    offline_enabled: boolean;
    offline_cache_max_age_hours: number;
    offline_price_policy: string;
    offline_stock_policy: string;
    offline_credit_allowed: boolean;
    offline_card_allowed: boolean;
    offline_transfer_allowed: boolean;
  };
  const priceListId = priceLists?.[0]?.id;
  const [{ data: prices }, { data: stock }] = await Promise.all([
    priceListId
      ? client
          .from("product_prices")
          .select(
            "product_variant_id,packaging_id,amount,branch_id,min_quantity,updated_at",
          )
          .eq("organization_id", organization.id)
          .eq("price_list_id", priceListId)
          .eq("status", "ACTIVE")
          .or(`branch_id.is.null,branch_id.eq.${terminal.branch_id}`)
          .lte("min_quantity", 1)
          .limit(10000)
      : Promise.resolve({ data: [] }),
    client
      .from("inventory_availability")
      .select("product_variant_id,available_base_quantity")
      .eq("organization_id", organization.id)
      .eq("branch_id", terminal.branch_id)
      .limit(10000),
  ]);
  const syncedAt = new Date().toISOString();
  const products = (variants ?? []).flatMap((variant) =>
    variant.product_variant_packaging.map((packaging) => ({
      organizationId: organization.id,
      branchId: terminal.branch_id,
      variantId: variant.id,
      packagingId: packaging.id,
      label: `${variant.products.name} · ${variant.name}`,
      packaging: packaging.name,
      sku: variant.sku,
      barcode:
        variant.product_barcodes.find(
          (barcode) => barcode.packaging_id === packaging.id,
        )?.barcode ??
        variant.product_barcodes[0]?.barcode ??
        null,
      price: Number(
        prices?.find(
          (price) =>
            price.product_variant_id === variant.id &&
            price.packaging_id === packaging.id,
        )?.amount ?? 0,
      ),
      availableBase: (stock ?? [])
        .filter((row) => row.product_variant_id === variant.id)
        .reduce((sum, row) => sum + Number(row.available_base_quantity), 0),
      conversion: Number(packaging.conversion_to_base),
      taxRate: Number(variant.products.tax_profiles?.rate ?? 0),
      currency: organization.currency_code,
    })),
  );
  return Response.json(
    {
      appVersion: appConfig.version,
      organization: {
        id: organization.id,
        name: organization.name,
        currency: organization.currency_code,
      },
      branch: { id: terminal.branch_id, name: terminal.branches?.name ?? "Branch" },
      terminal: { id: terminal.id, name: terminal.name, status: terminal.status },
      session: {
        id: session.id,
        cashierUserId: session.cashier_user_id,
        openedAt: session.opened_at,
      },
      permissions: [...permissions],
      settings: {
        offlineEnabled: offlineSettings.offline_enabled,
        maxAgeHours: offlineSettings.offline_cache_max_age_hours,
        pricePolicy: offlineSettings.offline_price_policy,
        stockPolicy: offlineSettings.offline_stock_policy,
        creditAllowed: offlineSettings.offline_credit_allowed,
        cardAllowed: offlineSettings.offline_card_allowed,
        transferAllowed: offlineSettings.offline_transfer_allowed,
      },
      customers: customers ?? [],
      methods: methods ?? [],
      accounts: accounts ?? [],
      products,
      syncedAt,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
