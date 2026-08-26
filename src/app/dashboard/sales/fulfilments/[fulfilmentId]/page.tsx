import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrganizationContext } from "@/features/organizations/context";
import { postFulfilment } from "@/features/sales/actions";
export default async function FulfilmentDetail({
  params,
}: {
  params: Promise<{ fulfilmentId: string }>;
}) {
  const id = (await params).fulfilmentId,
    { client, organization } = await getOrganizationContext();
  const { data: f } = await client
    .from("sales_fulfillments")
    .select(
      "*,customers(display_name),sales_orders(sales_order_number),branches(name),warehouses(name),storage_locations(name),inventory_transactions(transaction_number),sales_fulfillment_lines(*,sales_order_lines(description_snapshot,sku_snapshot,ordered_base_quantity,reserved_base_quantity,fulfilled_base_quantity,cancelled_base_quantity))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!f) notFound();
  return (
    <div className="space-y-7 print:p-0">
      <PageHeader
        eyebrow="Delivery note"
        title={f.fulfilment_number}
        description={`${organization.name} · ${f.customers?.display_name} · ${f.status}`}
      />
      <section className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2">
        <p>
          Sales Order <strong>{f.sales_orders?.sales_order_number}</strong>
        </p>
        <p>
          Date <strong>{new Date(f.fulfilled_at).toLocaleString()}</strong>
        </p>
        <p>
          Branch <strong>{f.branches?.name}</strong>
        </p>
        <p>
          Source{" "}
          <strong>
            {f.warehouses?.name} · {f.storage_locations?.name}
          </strong>
        </p>
        <p className="sm:col-span-2">
          Delivery address{" "}
          <strong>{JSON.stringify(f.delivery_address_snapshot ?? {})}</strong>
        </p>
      </section>
      <table className="w-full rounded-2xl border text-sm">
        <thead>
          <tr>
            <th className="p-3 text-left">Product</th>
            <th className="p-3 text-left">This fulfilment</th>
            <th className="p-3 text-left">Order outstanding</th>
            <th className="p-3 text-left">Remaining reservation</th>
          </tr>
        </thead>
        <tbody>
          {f.sales_fulfillment_lines.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="p-3">
                {l.sales_order_lines?.description_snapshot} ·{" "}
                {l.sales_order_lines?.sku_snapshot}
              </td>
              <td className="p-3">{l.entered_quantity}</td>
              <td className="p-3">
                {Number(l.sales_order_lines?.ordered_base_quantity ?? 0) -
                  Number(l.sales_order_lines?.fulfilled_base_quantity ?? 0) -
                  Number(l.sales_order_lines?.cancelled_base_quantity ?? 0)}
              </td>
              <td className="p-3">
                {l.sales_order_lines?.reserved_base_quantity ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {f.notes && <p>Notes: {f.notes}</p>}
      {f.status === "POSTED" && (
        <section className="grid gap-3 rounded-2xl border bg-surface p-5 sm:grid-cols-3">
          <p>
            SALE transaction
            <br />
            <strong>
              {f.inventory_transactions?.transaction_number ?? "Posted"}
            </strong>
          </p>
          <p>
            Actual COGS
            <br />
            <strong>
              {f.sales_fulfillment_lines.reduce(
                (total, line) => total + Number(line.inventory_cost_base),
                0,
              )}
            </strong>
          </p>
          <p>
            Gross profit
            <br />
            <strong>
              {f.sales_fulfillment_lines.reduce(
                (total, line) => total + Number(line.gross_profit_base),
                0,
              )}
            </strong>
          </p>
        </section>
      )}
      {f.status === "DRAFT" && (
        <form className="print:hidden" action={postFulfilment.bind(null, id)}>
          <Button>Post fulfilment</Button>
        </form>
      )}
    </div>
  );
}
