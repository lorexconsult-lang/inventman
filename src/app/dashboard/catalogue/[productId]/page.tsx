import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  deleteProductImage,
  setProductStatus,
} from "@/features/catalogue/actions";
import {
  BarcodeForm,
  ImageUploadForm,
  PackagingForm,
  PriceForm,
  ProductEditForm,
} from "@/features/catalogue/components/product-detail-forms";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const { client, organization } = await getOrganizationContext();
  const [
    { data: product },
    { data: variants },
    { data: units },
    { data: priceLists },
    { data: branches },
    { data: categories },
    { data: brands },
    { data: taxes },
    { data: images },
  ] = await Promise.all([
    client
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("organization_id", organization.id)
      .maybeSingle(),
    client
      .from("product_variants")
      .select(
        "id,name,sku,status,reorder_point,product_variant_packaging(id,name,is_base_unit,conversion_to_base,units_of_measure(name,symbol)),product_barcodes(id,barcode,barcode_type),product_prices(id,amount,min_quantity,branch_id,packaging_id,price_lists(name,currency_code))",
      )
      .eq("product_id", productId)
      .order("created_at"),
    client
      .from("units_of_measure")
      .select("id,name,symbol")
      .eq("is_active", true)
      .order("name"),
    client
      .from("price_lists")
      .select("id,name,currency_code")
      .eq("is_active", true)
      .order("name"),
    client
      .from("branches")
      .select("id,name")
      .eq("status", "active")
      .order("name"),
    client
      .from("product_categories")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
    client.from("brands").select("id,name").eq("is_active", true).order("name"),
    client
      .from("tax_profiles")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
    client
      .from("product_images")
      .select("id,storage_path,alt_text,is_primary")
      .eq("product_id", productId)
      .order("sort_order"),
  ]);
  if (!product) notFound();
  const signed = await Promise.all(
    (images ?? []).map(async (item) => ({
      ...item,
      url:
        (
          await client.storage
            .from("product-images")
            .createSignedUrl(item.storage_path, 3600)
        ).data?.signedUrl ?? "",
    })),
  );
  const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Catalogue / ${product.product_type.replaceAll("_", " ")}`}
        title={product.name}
        description="Catalogue configuration only. Physical stock is introduced by the Inventory Ledger."
        actions={
          <>
            <StatusBadge
              tone={product.status === "ACTIVE" ? "positive" : "neutral"}
            >
              {product.status}
            </StatusBadge>
            <form action={setProductStatus.bind(null, product.id, next)}>
              <Button variant="secondary">
                {next === "INACTIVE" ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
            {product.status !== "ARCHIVED" && (
              <form
                action={setProductStatus.bind(null, product.id, "ARCHIVED")}
              >
                <Button variant="secondary">Archive</Button>
              </form>
            )}
          </>
        }
      />
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Product details</h2>
        <div className="mt-5">
          <ProductEditForm
            product={product}
            categories={categories ?? []}
            brands={brands ?? []}
            taxes={taxes ?? []}
          />
        </div>
      </section>
      <section className="rounded-2xl border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Images</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {signed.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border">
              <div className="relative aspect-square bg-muted">
                {item.url && (
                  <Image
                    src={item.url}
                    alt={item.alt_text ?? product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
              </div>
              <form
                action={deleteProductImage.bind(null, product.id, item.id)}
                className="p-2"
              >
                <button className="text-sm text-danger">
                  Delete{item.is_primary ? " primary" : ""}
                </button>
              </form>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <ImageUploadForm productId={product.id} />
        </div>
      </section>
      {(variants ?? []).map((variant) => (
        <section
          key={variant.id}
          className="rounded-2xl border bg-surface p-5 sm:p-7"
        >
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">{variant.name}</h2>
              <p className="text-sm text-subtle">
                SKU: {variant.sku ?? "Not assigned"}
              </p>
            </div>
            <StatusBadge
              tone={variant.status === "ACTIVE" ? "positive" : "neutral"}
            >
              {variant.status}
            </StatusBadge>
          </div>
          <div className="mt-6 space-y-7 border-t pt-6">
            <div>
              <h3 className="mb-4 font-semibold">Packaging</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {variant.product_variant_packaging.map((x) => (
                  <span
                    key={x.id}
                    className="rounded-lg bg-muted px-3 py-2 text-sm"
                  >
                    {x.name} · {x.conversion_to_base}{" "}
                    {x.units_of_measure?.symbol}
                    {x.is_base_unit ? " · Base" : ""}
                  </span>
                ))}
              </div>
              <PackagingForm variantId={variant.id} units={units ?? []} />
            </div>
            <div className="border-t pt-6">
              <h3 className="mb-4 font-semibold">Barcodes</h3>
              <p className="mb-4 text-sm text-subtle">
                {variant.product_barcodes
                  .map((x) => `${x.barcode} (${x.barcode_type})`)
                  .join(" · ") || "No barcodes"}
              </p>
              <BarcodeForm
                variantId={variant.id}
                packages={variant.product_variant_packaging}
              />
            </div>
            <div className="border-t pt-6">
              <h3 className="mb-4 font-semibold">Prices</h3>
              <div className="mb-4 space-y-1 text-sm">
                {variant.product_prices.map((x) => (
                  <p key={x.id}>
                    {x.price_lists?.name}: {x.price_lists?.currency_code}{" "}
                    {x.amount} · minimum {x.min_quantity}
                    {x.branch_id ? " · branch-specific" : ""}
                  </p>
                ))}
              </div>
              <PriceForm
                variantId={variant.id}
                packages={variant.product_variant_packaging}
                priceLists={priceLists ?? []}
                branches={branches ?? []}
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
