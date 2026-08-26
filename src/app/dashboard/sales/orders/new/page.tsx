import { PageHeader } from "@/components/ui/page-header";
import { OrderForm } from "@/features/sales/components/forms";
import { salesFormData } from "@/features/sales/queries";
export default async function NewOrder() {
  const d = await salesFormData();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales / Orders"
        title="Create direct Sales Order"
        description="Draft creation does not reserve stock. Confirmation performs authoritative availability and credit checks."
      />
      <OrderForm
        customers={d.customers.map((x) => ({
          id: x.id,
          label: `${x.customer_code} · ${x.display_name}`,
          priceListId: x.default_price_list_id,
        }))}
        branches={d.branches.map((x) => ({ id: x.id, label: x.name }))}
        warehouses={d.warehouses.map((x) => ({
          id: x.id,
          label: x.name,
          branchId: x.branch_id,
        }))}
        locations={d.locations.map((x) => ({
          id: x.id,
          label: x.name,
          warehouseId: x.warehouse_id,
        }))}
        priceLists={d.priceLists.map((x) => ({ id: x.id, label: x.name }))}
        currency={d.organization.currency_code}
      />
    </div>
  );
}
