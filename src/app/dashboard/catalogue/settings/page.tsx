import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { setSetupStatus } from "@/features/catalogue/actions";
import {
  BrandForm,
  CategoryForm,
  PriceListForm,
  TaxForm,
  UnitForm,
} from "@/features/catalogue/components/setup-forms";
import { getOrganizationContext } from "@/features/organizations/context";
type Item = { id: string; name: string; is_active: boolean };
function Items({
  items,
  table,
}: {
  items: Item[];
  table:
    | "product_categories"
    | "brands"
    | "units_of_measure"
    | "tax_profiles"
    | "price_lists";
}) {
  return (
    <div className="mt-5 divide-y rounded-xl border">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 p-3"
        >
          <span
            className={
              item.is_active ? "font-medium" : "text-subtle line-through"
            }
          >
            {item.name}
          </span>
          <form
            action={setSetupStatus.bind(null, table, item.id, !item.is_active)}
          >
            <Button variant="ghost">
              {item.is_active ? "Archive" : "Restore"}
            </Button>
          </form>
        </div>
      ))}
    </div>
  );
}
export default async function CatalogueSettings() {
  const { client, organization } = await getOrganizationContext();
  const [
    { data: categories },
    { data: brands },
    { data: units },
    { data: taxes },
    { data: prices },
  ] = await Promise.all([
    client
      .from("product_categories")
      .select("id,name,is_active")
      .eq("organization_id", organization.id)
      .order("name"),
    client
      .from("brands")
      .select("id,name,is_active")
      .eq("organization_id", organization.id)
      .order("name"),
    client
      .from("units_of_measure")
      .select("id,name,is_active")
      .eq("organization_id", organization.id)
      .order("name"),
    client
      .from("tax_profiles")
      .select("id,name,is_active")
      .eq("organization_id", organization.id)
      .order("name"),
    client
      .from("price_lists")
      .select("id,name,is_active")
      .eq("organization_id", organization.id)
      .order("name"),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalogue"
        title="Settings"
        description="Manage the classification, measurement, tax, and pricing foundations used by products."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Categories">
          <CategoryForm categories={categories ?? []} />
          <Items table="product_categories" items={categories ?? []} />
        </Section>
        <Section title="Brands">
          <BrandForm />
          <Items table="brands" items={brands ?? []} />
        </Section>
        <Section title="Units of measure">
          <UnitForm />
          <Items table="units_of_measure" items={units ?? []} />
        </Section>
        <Section title="Tax profiles">
          <TaxForm />
          <Items table="tax_profiles" items={taxes ?? []} />
        </Section>
        <Section title="Price lists">
          <PriceListForm currency={organization.currency_code} />
          <Items table="price_lists" items={prices ?? []} />
        </Section>
      </div>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-surface p-5 sm:p-7">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
