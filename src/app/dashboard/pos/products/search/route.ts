import { NextResponse } from "next/server";
import { requireOrganizationPermission } from "@/features/organizations/context";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const branchId = url.searchParams.get("branchId") ?? "";
  const customerId = url.searchParams.get("customerId") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const { client, organization } =
    await requireOrganizationPermission("pos.access");
  const [{ data: customer }, { data: barcodeRows }] = await Promise.all([
    customerId
      ? client
          .from("customers")
          .select("default_price_list_id")
          .eq("id", customerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client
      .from("product_barcodes")
      .select("product_variant_id,packaging_id,barcode")
      .eq("organization_id", organization.id)
      .ilike("barcode", `${q}%`)
      .limit(20),
  ]);
  let priceListId = customer?.default_price_list_id ?? null;
  if (!priceListId) {
    const { data } = await client
      .from("price_lists")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("is_default", true)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    priceListId = data?.id ?? null;
  }
  const barcodeIds = (barcodeRows ?? []).map((x) => x.product_variant_id);
  let query = client
    .from("product_variants")
    .select(
      "id,name,sku,internal_code,products!inner(name,tax_profiles(rate)),product_variant_packaging!inner(id,name,conversion_to_base,can_sell),product_barcodes(barcode,packaging_id)",
    )
    .eq("organization_id", organization.id)
    .eq("status", "ACTIVE")
    .eq("products.status", "ACTIVE")
    .eq("product_variant_packaging.can_sell", true);
  if (barcodeIds.length)
    query = query.or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,internal_code.ilike.%${q}%,id.in.(${barcodeIds.join(",")})`,
    );
  else
    query = query.or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,internal_code.ilike.%${q}%`,
    );
  const { data: variants } = await query.limit(20);
  const ids = (variants ?? []).map((x) => x.id);
  const [{ data: prices }, { data: stock }] = await Promise.all([
    ids.length && priceListId
      ? client
          .from("product_prices")
          .select(
            "product_variant_id,packaging_id,amount,branch_id,min_quantity",
          )
          .eq("organization_id", organization.id)
          .eq("price_list_id", priceListId)
          .in("product_variant_id", ids)
          .eq("status", "ACTIVE")
          .or(`branch_id.is.null,branch_id.eq.${branchId}`)
          .lte("min_quantity", 1)
          .order("branch_id", { ascending: false })
      : Promise.resolve({ data: [] }),
    ids.length
      ? client
          .from("inventory_availability")
          .select("product_variant_id,available_base_quantity")
          .eq("organization_id", organization.id)
          .eq("branch_id", branchId)
          .in("product_variant_id", ids)
      : Promise.resolve({ data: [] }),
  ]);
  return NextResponse.json(
    (variants ?? []).flatMap((v) =>
      v.product_variant_packaging.map((p) => ({
        variantId: v.id,
        packagingId: p.id,
        label: `${v.products.name} · ${v.name}`,
        packaging: p.name,
        sku: v.sku,
        barcode:
          v.product_barcodes.find((b) => b.packaging_id === p.id)?.barcode ??
          v.product_barcodes[0]?.barcode ??
          null,
        price: Number(
          prices?.find(
            (x) => x.product_variant_id === v.id && x.packaging_id === p.id,
          )?.amount ?? 0,
        ),
        availableBase: (stock ?? [])
          .filter((x) => x.product_variant_id === v.id)
          .reduce((n, x) => n + Number(x.available_base_quantity), 0),
        conversion: Number(p.conversion_to_base),
        taxRate: Number(v.products.tax_profiles?.rate ?? 0),
      })),
    ),
  );
}
