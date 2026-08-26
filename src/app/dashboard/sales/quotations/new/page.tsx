import { PageHeader } from "@/components/ui/page-header";
import { QuotationForm } from "@/features/sales/components/forms";
import { salesFormData } from "@/features/sales/queries";
export default async function NewQuotation() {
  const d = await salesFormData();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales / Quotations"
        title="Create quotation"
        description="Search the catalogue on demand. Draft quotations do not reserve stock."
      />
      <QuotationForm
        customers={d.customers.map((x) => ({
          id: x.id,
          label: `${x.customer_code} · ${x.display_name}`,
          priceListId: x.default_price_list_id,
        }))}
        branches={d.branches.map((x) => ({ id: x.id, label: x.name }))}
        priceLists={d.priceLists.map((x) => ({ id: x.id, label: x.name }))}
        currency={d.organization.currency_code}
      />
    </div>
  );
}
