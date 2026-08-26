import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrganizationContext } from "@/features/organizations/context";
import { salesPermissions } from "@/features/sales/queries";
import {
  cancelOrder,
  confirmOrder,
  createInvoice,
} from "@/features/sales/actions";
import { FulfilmentForm } from "@/features/sales/components/forms";
export default async function OrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const id = (await params).orderId,
    { client, organization } = await getOrganizationContext(),
    permissions = await salesPermissions();
  const [{ data: o }, { data: exposure }, { data: fulfilments }] =
    await Promise.all([
      client
        .from("sales_orders")
        .select(
          "*,customers(display_name,customer_code,credit_limit),branches(name),warehouses(name),storage_locations(name),sales_order_lines(*)",
        )
        .eq("id", id)
        .maybeSingle(),
      client
        .from("customer_credit_exposure")
        .select("*")
        .eq(
          "customer_id",
          (
            await client
              .from("sales_orders")
              .select("customer_id")
              .eq("id", id)
              .single()
          ).data?.customer_id ?? "",
        )
        .maybeSingle(),
      client
        .from("sales_fulfillments")
        .select(
          "id,fulfilment_number,status,fulfilled_at,inventory_transaction_id,sales_fulfillment_lines(base_quantity,inventory_cost_base,gross_profit_base)",
        )
        .eq("sales_order_id", id)
        .order("fulfilled_at"),
    ]);
  if (!o) notFound();
  const lineData = o.sales_order_lines.map((l) => ({
    id: l.id,
    label: `${l.description_snapshot} · ${l.sku_snapshot}`,
    remaining:
      Number(l.ordered_base_quantity) -
      Number(l.fulfilled_base_quantity) -
      Number(l.cancelled_base_quantity),
    reserved: Number(l.reserved_base_quantity),
  }));
  const posted = (fulfilments ?? []).filter((x) => x.status === "POSTED");
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales Order"
        title={o.sales_order_number}
        description={`${o.customers?.display_name} · ${o.status} · ${o.branches?.name}`}
      />
      {permissions["receivables.view"] && (
        <section className="grid gap-3 rounded-2xl border bg-surface p-5 sm:grid-cols-4">
          <p>
            Credit limit
            <br />
            <strong>{o.customers?.credit_limit}</strong>
          </p>
          <p>
            Current exposure
            <br />
            <strong>{exposure?.exposure_base ?? 0}</strong>
          </p>
          <p>
            Available credit
            <br />
            <strong>
              {Math.max(
                Number(o.customers?.credit_limit) -
                  Number(exposure?.exposure_base ?? 0),
                0,
              )}
            </strong>
          </p>
          <p>
            Proposed exposure
            <br />
            <strong>
              {Number(exposure?.exposure_base ?? 0) +
                Number(o.base_currency_total)}{" "}
              {organization.currency_code}
            </strong>
          </p>
        </section>
      )}
      <section className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted">
            <tr>
              {[
                "Product",
                "Ordered",
                "Reserved",
                "Backordered",
                "Fulfilled",
                "Cancelled",
                "Outstanding",
              ].map((x) => (
                <th key={x} className="p-3 text-left">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {o.sales_order_lines.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">
                  {l.description_snapshot}
                  <br />
                  <small>{l.sku_snapshot}</small>
                </td>
                <td className="p-3">{l.ordered_base_quantity}</td>
                <td className="p-3">{l.reserved_base_quantity}</td>
                <td className="p-3">{l.backordered_base_quantity}</td>
                <td className="p-3">{l.fulfilled_base_quantity}</td>
                <td className="p-3">{l.cancelled_base_quantity}</td>
                <td className="p-3">
                  {Number(l.ordered_base_quantity) -
                    Number(l.fulfilled_base_quantity) -
                    Number(l.cancelled_base_quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="flex flex-wrap gap-2">
        {o.status === "DRAFT" && permissions["sales.order_confirm"] && (
          <form action={confirmOrder.bind(null, id, true, false)}>
            <Button>Review and confirm with backorders</Button>
          </form>
        )}
        {o.status === "DRAFT" && permissions["sales.credit_override"] && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            Credit override authority is recognized, but direct bypass is
            disabled in the UI; approval must be recorded before confirmation.
          </p>
        )}
        {!["FULFILLED", "INVOICED", "CANCELLED", "CLOSED"].includes(o.status) &&
          permissions["sales.order_cancel"] && (
            <form action={cancelOrder.bind(null, id)}>
              <Button variant="secondary">Cancel remaining order</Button>
            </form>
          )}
      </div>
      {[
        "CONFIRMED",
        "PARTIALLY_RESERVED",
        "RESERVED",
        "PARTIALLY_FULFILLED",
      ].includes(o.status) && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Prepare fulfilment</h2>
          <FulfilmentForm
            orderId={id}
            lines={lineData.filter((x) => x.remaining > 0)}
          />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Fulfilments</h2>
        {fulfilments?.map((f) => (
          <article key={f.id} className="rounded-xl border p-4">
            <a
              href={`/dashboard/sales/fulfilments/${f.id}`}
              className="font-mono font-semibold"
            >
              {f.fulfilment_number}
            </a>{" "}
            · {f.status} · {new Date(f.fulfilled_at).toLocaleString()}
            <p className="text-sm text-subtle">
              Quantity{" "}
              {f.sales_fulfillment_lines.reduce(
                (n, l) => n + Number(l.base_quantity),
                0,
              )}
              {permissions["sales.reports_view"] &&
                ` · COGS ${f.sales_fulfillment_lines.reduce((n, l) => n + Number(l.inventory_cost_base), 0)} · gross profit ${f.sales_fulfillment_lines.reduce((n, l) => n + Number(l.gross_profit_base), 0)}`}
            </p>
          </article>
        ))}
      </section>
      {posted.length > 0 && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-surface p-4"
          action={createInvoice.bind(
            null,
            id,
            posted.map((x) => x.id),
          )}
        >
          <label className="text-sm font-medium">
            Due date
            <input
              name="dueDate"
              type="date"
              className="mt-2 block min-h-11 rounded-xl border px-3"
            />
          </label>
          <Button>Create invoice from posted fulfilments</Button>
        </form>
      )}
    </div>
  );
}
