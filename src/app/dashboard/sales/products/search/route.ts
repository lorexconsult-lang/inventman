import { NextResponse } from "next/server";
import { requireOrganizationPermission } from "@/features/organizations/context";
export async function GET(request: Request) {
  const url = new URL(request.url),
    q = (url.searchParams.get("q") ?? "").trim(),
    branchId = url.searchParams.get("branchId") ?? "",
    priceListId = url.searchParams.get("priceListId") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const { client, organization } =
    await requireOrganizationPermission("sales.order_create");
  const { data: variants } = await client
    .from("product_variants")
    .select(
      "id,name,sku,internal_code,products!inner(name,tax_profiles(rate)),product_variant_packaging!inner(id,name,can_sell),product_barcodes(barcode)",
    )
    .eq("organization_id", organization.id)
    .eq("status", "ACTIVE")
    .eq("product_variant_packaging.can_sell", true)
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%,internal_code.ilike.%${q}%`)
    .limit(20);
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
          .order("min_quantity", { ascending: false })
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
        price: Number(
          prices?.find(
            (x) => x.product_variant_id === v.id && x.packaging_id === p.id,
          )?.amount ?? 0,
        ),
        available: (stock ?? [])
          .filter((x) => x.product_variant_id === v.id)
          .reduce((n, x) => n + Number(x.available_base_quantity), 0),
        tax: Number(v.products.tax_profiles?.rate ?? 0),
      })),
    ),
  );
}
