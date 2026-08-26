import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
import { postFulfilment } from "@/features/sales/actions";
import { Button } from "@/components/ui/button";
export default async function Fulfilments() {
  const { client } = await getOrganizationContext();
  const { data } = await client
    .from("sales_fulfillments")
    .select(
      "id,fulfilment_number,status,fulfilled_at,inventory_transaction_id,customers(display_name),sales_orders(sales_order_number),branches(name),sales_fulfillment_lines(base_quantity,inventory_cost_base,gross_profit_base)",
    )
    .order("fulfilled_at", { ascending: false })
    .range(0, 99);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Fulfilment queue"
        description="Drafts do not affect stock. Posting invokes the atomic SALE workflow."
      />
      <div className="grid gap-3">
        {data?.map((x) => (
          <article key={x.id} className="rounded-xl border bg-surface p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <Link
                  href={`/dashboard/sales/fulfilments/${x.id}`}
                  className="font-mono font-semibold"
                >
                  {x.fulfilment_number}
                </Link>
                <p className="text-sm text-subtle">
                  {x.customers?.display_name} ·{" "}
                  {x.sales_orders?.sales_order_number} · {x.branches?.name}
                </p>
              </div>
              <span>{x.status}</span>
            </div>
            <p className="mt-2 text-sm">
              Quantity{" "}
              {x.sales_fulfillment_lines.reduce(
                (n, l) => n + Number(l.base_quantity),
                0,
              )}{" "}
              · Inventory transaction{" "}
              {x.inventory_transaction_id ?? "Not posted"}
            </p>
            {x.status === "DRAFT" && (
              <form className="mt-3" action={postFulfilment.bind(null, x.id)}>
                <Button>Review and post fulfilment</Button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
