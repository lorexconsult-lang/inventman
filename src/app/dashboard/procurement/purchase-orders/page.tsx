import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  approvePurchaseOrder,
  postReceipt,
} from "@/features/procurement/actions";
import { PurchaseOrderForm } from "@/features/procurement/components/forms";
import { procurementFormData } from "@/features/procurement/queries";
export default async function PurchaseOrders() {
  const d = await procurementFormData();
  const { data } = await d.client
    .from("purchase_orders")
    .select(
      "id,purchase_order_number,status,total,currency,expected_delivery_date,suppliers(legal_name),purchase_order_lines(id,product_description_snapshot,ordered_base_quantity,accepted_base_quantity)",
    )
    .order("created_at", { ascending: false })
    .range(0, 99);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Procurement"
        title="Purchase orders"
        description="Approved commercial terms are protected from material rewrites."
      />
      <PurchaseOrderForm
        suppliers={d.suppliers}
        branches={d.branches}
        warehouses={d.warehouses}
        locations={d.locations}
        variants={d.variants}
        currency={d.organization.currency_code}
      />
      <div className="space-y-3">
        {data?.map((po) => (
          <article key={po.id} className="rounded-xl border bg-surface p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <strong className="font-mono">
                  {po.purchase_order_number}
                </strong>
                <p className="text-sm text-subtle">
                  {po.suppliers?.legal_name} · {po.currency} {po.total} ·{" "}
                  {po.status}
                </p>
              </div>
              {po.status === "DRAFT" && (
                <form action={approvePurchaseOrder.bind(null, po.id)}>
                  <Button>Approve PO</Button>
                </form>
              )}
            </div>
            <div className="mt-4 space-y-2 border-t pt-3">
              {po.purchase_order_lines.map((line) => {
                const outstanding =
                  Number(line.ordered_base_quantity) -
                  Number(line.accepted_base_quantity);
                return (
                  <div key={line.id} className="flex justify-between text-sm">
                    <span>
                      {line.product_description_snapshot} · outstanding{" "}
                      {outstanding}
                    </span>
                    {["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(
                      po.status,
                    ) &&
                      outstanding > 0 && (
                        <form
                          action={postReceipt.bind(
                            null,
                            po.id,
                            line.id,
                            String(outstanding),
                          )}
                        >
                          <Button variant="secondary">
                            Receive outstanding
                          </Button>
                        </form>
                      )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
