import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrganizationContext } from "@/features/organizations/context";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const { client, organization } = await getOrganizationContext();
  let request = client
    .from("products")
    .select(
      "id,name,product_type,status,updated_at,product_categories(name),brands(name),product_variants(id,sku,name)",
      { count: "exact" },
    )
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false })
    .range(0, 49);
  if (query.q) request = request.ilike("name", `%${query.q}%`);
  if (query.status) request = request.eq("status", query.status);
  if (query.type) request = request.eq("product_type", query.type);
  const { data, count } = await request;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${count ?? 0} products across goods, services, bundles, recipes, and controlled items.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              href="/dashboard/catalogue/import"
            >
              Import
            </Link>
            <Link
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              href="/dashboard/catalogue/export"
            >
              Export
            </Link>
            <Link
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
              href="/dashboard/catalogue/new"
            >
              Add product
            </Link>
          </div>
        }
      />
      <form className="grid gap-3 rounded-2xl border bg-surface p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Search product name"
          className="min-h-11 rounded-xl border px-3"
        />
        <select
          name="type"
          defaultValue={query.type}
          className="min-h-11 rounded-xl border px-3"
        >
          <option value="">All types</option>
          <option>STOCKED_PRODUCT</option>
          <option>SERVICE</option>
          <option>NON_STOCKED_PRODUCT</option>
          <option>BUNDLE</option>
          <option>RECIPE</option>
          <option>SERIALIZED_PRODUCT</option>
          <option>BATCH_CONTROLLED_PRODUCT</option>
          <option>PERISHABLE_PRODUCT</option>
        </select>
        <select
          name="status"
          defaultValue={query.status}
          className="min-h-11 rounded-xl border px-3"
        >
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
          <option>ARCHIVED</option>
        </select>
        <button className="rounded-xl bg-ink px-5 text-white">Filter</button>
      </form>
      {!data?.length ? (
        <EmptyState
          icon={<PackageSearch className="size-5" />}
          title="No products found"
          description="Create a product or adjust your filters."
          action={
            <Link
              className="font-semibold text-accent"
              href="/dashboard/catalogue/new"
            >
              Create product
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-surface">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 bg-muted px-5 py-3 text-xs font-semibold uppercase text-subtle md:grid">
            <span>Product</span>
            <span>Classification</span>
            <span>Variants</span>
            <span>Status</span>
          </div>
          {data.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/catalogue/${product.id}`}
              className="grid gap-2 border-t px-5 py-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center"
            >
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-subtle">
                  {product.product_variants
                    .map((x) => x.sku || x.name)
                    .join(" · ")}
                </p>
              </div>
              <p className="text-sm text-subtle">
                {product.product_categories?.name ?? "Uncategorized"}
                {product.brands?.name ? ` · ${product.brands.name}` : ""}
              </p>
              <p className="text-sm">{product.product_variants.length}</p>
              <StatusBadge
                tone={product.status === "ACTIVE" ? "positive" : "neutral"}
              >
                {product.status}
              </StatusBadge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
