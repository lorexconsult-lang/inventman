import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "@/features/sales/components/forms";
import { salesFormData } from "@/features/sales/queries";
export default async function NewCustomer() {
  const d = await salesFormData();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales / Customers"
        title="Create customer"
        description="Create an Individual or Business customer. Credit remains server-controlled."
      />
      <CustomerForm
        currency={d.organization.currency_code}
        priceLists={d.priceLists.map((x) => ({ id: x.id, label: x.name }))}
      />
    </div>
  );
}
