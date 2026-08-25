import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SimpleProductForm } from "@/features/catalogue/components/simple-product-form";
import { VariantProductForm } from "@/features/catalogue/components/variant-product-form";
import { getOrganizationContext } from "@/features/organizations/context";
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const { client, organization } = await getOrganizationContext();
  const [
    { data: categories },
    { data: brands },
    { data: units },
    { data: taxes },
    { data: priceLists },
  ] = await Promise.all([
    client
      .from("product_categories")
      .select("id,name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("brands")
      .select("id,name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("units_of_measure")
      .select("id,name,symbol")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("tax_profiles")
      .select("id,name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    client
      .from("price_lists")
      .select("id,name,currency_code,is_default")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue / Products"
        title="Create product"
        description="Choose a simple item or generate variants from options."
      />
      <div className="flex gap-2">
        <Link
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode !== "variants" ? "bg-ink text-white" : "border"}`}
          href="/dashboard/catalogue/new"
        >
          Simple
        </Link>
        <Link
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "variants" ? "bg-ink text-white" : "border"}`}
          href="/dashboard/catalogue/new?mode=variants"
        >
          With variants
        </Link>
      </div>
      {mode === "variants" ? (
        <VariantProductForm
          categories={categories ?? []}
          brands={brands ?? []}
          taxes={taxes ?? []}
        />
      ) : (
        <SimpleProductForm
          categories={categories ?? []}
          brands={brands ?? []}
          units={units ?? []}
          taxes={taxes ?? []}
          priceLists={priceLists ?? []}
        />
      )}
    </div>
  );
}
