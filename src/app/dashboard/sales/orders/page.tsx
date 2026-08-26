import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const q = await searchParams,
    { client } = await getOrganizationContext();
  let req = client
    .from("sales_orders")
    .select(
      "id,sales_order_number,order_date,status,total,currency,customers(display_name),branches(name),sales_order_lines(ordered_base_quantity,reserved_base_quantity,backordered_base_quantity,fulfilled_base_quantity,cancelled_base_quantity)",
    )
    .order("order_date", { ascending: false })
    .range(0, 99);
  if (q.status) req = req.eq("status", q.status);
  const { data } = await req;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Sales Orders"
        description="Ordered, reserved, backordered, fulfilled and outstanding quantities remain explicit."
        actions={
          <Link
            href="/dashboard/sales/orders/new"
            className="rounded-xl bg-accent px-4 py-2 text-white"
          >
            Direct Sales Order
          </Link>
        }
      />
      <div className="grid gap-3">
        {data?.map((x) => {
          const sum = (
              k:
                | "ordered_base_quantity"
                | "reserved_base_quantity"
                | "backordered_base_quantity"
                | "fulfilled_base_quantity"
                | "cancelled_base_quantity",
            ) => x.sales_order_lines.reduce((n, l) => n + Number(l[k]), 0),
            out =
              sum("ordered_base_quantity") -
              sum("fulfilled_base_quantity") -
              sum("cancelled_base_quantity");
          return (
            <Link
              href={`/dashboard/sales/orders/${x.id}`}
              key={x.id}
              className="rounded-xl border bg-surface p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  {x.sales_order_number} · {x.customers?.display_name}
                </strong>
                <span>
                  {x.status} · {x.currency} {x.total}
                </span>
              </div>
              <p className="mt-2 text-sm text-subtle">
                Ordered {sum("ordered_base_quantity")} · Reserved{" "}
                {sum("reserved_base_quantity")} · Backordered{" "}
                {sum("backordered_base_quantity")} · Fulfilled{" "}
                {sum("fulfilled_base_quantity")} · Outstanding {out}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
