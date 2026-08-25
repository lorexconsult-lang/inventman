import { getOrganizationContext } from "@/features/organizations/context";
import { catalogueCsvHeaders, csvEscape } from "@/features/catalogue/csv";
export async function GET() {
  const { client, organization } = await getOrganizationContext();
  const { data, error } = await client
    .from("products")
    .select(
      "name,product_type,reference_cost,product_categories(name),brands(name),product_variants(sku,reorder_point,product_barcodes(barcode),product_variant_packaging(is_base_unit,units_of_measure(name,symbol)),product_prices(amount,price_lists(is_default)))",
    )
    .eq("organization_id", organization.id)
    .order("name");
  if (error) return new Response("Export failed", { status: 500 });
  const rows = (data ?? []).flatMap((product) =>
    product.product_variants.map((variant) => {
      const base = variant.product_variant_packaging.find(
        (x) => x.is_base_unit,
      );
      const price =
        variant.product_prices.find((x) => x.price_lists?.is_default) ??
        variant.product_prices[0];
      return [
        product.name,
        variant.sku ?? "",
        variant.product_barcodes[0]?.barcode ?? "",
        product.product_categories?.name ?? "",
        product.brands?.name ?? "",
        base?.units_of_measure?.symbol ?? base?.units_of_measure?.name ?? "",
        price?.amount ?? "",
        product.reference_cost ?? "",
        variant.reorder_point ?? "",
        product.product_type,
      ]
        .map(csvEscape)
        .join(",");
    }),
  );
  return new Response([catalogueCsvHeaders.join(","), ...rows].join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=catalogue-export.csv",
    },
  });
}
