import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const filters = await searchParams;
  const { client, organization } =
    await requireOrganizationPermission("sales.reports_view");
  let linesRequest = client
    .from("sales_fulfillment_lines")
    .select(
      "revenue_base,inventory_cost_base,gross_profit_base,base_quantity,product_variants(name,products(name,product_categories(name),brands(name))),sales_fulfillments!inner(fulfilled_at,status,branches(name),customers(display_name))",
    )
    .eq("sales_fulfillments.status", "POSTED");
  if (filters.from)
    linesRequest = linesRequest.gte(
      "sales_fulfillments.fulfilled_at",
      filters.from,
    );
  if (filters.to)
    linesRequest = linesRequest.lte(
      "sales_fulfillments.fulfilled_at",
      `${filters.to}T23:59:59.999Z`,
    );
  const [
    { data: lines },
    { data: orders },
    { data: quotes },
    { data: returns },
  ] = await Promise.all([
    linesRequest,
    client.from("sales_orders").select("status,base_currency_total"),
    client.from("sales_quotations").select("status"),
    client.from("sales_returns").select("status"),
  ]);
  const revenue = (lines ?? []).reduce((n, x) => n + Number(x.revenue_base), 0),
    cost = (lines ?? []).reduce((n, x) => n + Number(x.inventory_cost_base), 0),
    converted = (quotes ?? []).filter((x) => x.status === "CONVERTED").length;
  const aggregate = (
    label: (line: NonNullable<typeof lines>[number]) => string,
  ) => {
    const values = new Map<
      string,
      { revenue: number; cost: number; profit: number }
    >();
    for (const line of lines ?? []) {
      const key = label(line) || "Unassigned";
      const value = values.get(key) ?? { revenue: 0, cost: 0, profit: 0 };
      value.revenue += Number(line.revenue_base);
      value.cost += Number(line.inventory_cost_base);
      value.profit += Number(line.gross_profit_base);
      values.set(key, value);
    }
    return [...values.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Sales reports"
        description="Revenue and profit use posted fulfilments and actual Inventory Ledger COGS."
        actions={
          <Link
            href={`/dashboard/sales/export?report=sales&from=${filters.from ?? ""}&to=${filters.to ?? ""}`}
            className="rounded-xl border px-4 py-2"
          >
            Export CSV
          </Link>
        }
      />
      <form className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-3">
        <input
          aria-label="From date"
          name="from"
          type="date"
          defaultValue={filters.from ?? ""}
          className="min-h-11 rounded-xl border px-3"
        />
        <input
          aria-label="To date"
          name="to"
          type="date"
          defaultValue={filters.to ?? ""}
          className="min-h-11 rounded-xl border px-3"
        />
        <button className="rounded-xl bg-ink px-4 text-white">
          Apply period
        </button>
      </form>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [`Revenue (${organization.currency_code})`, revenue],
          ["Actual COGS", cost],
          ["Gross profit", revenue - cost],
          [
            "Gross margin",
            revenue
              ? `${(((revenue - cost) / revenue) * 100).toFixed(2)}%`
              : "0%",
          ],
          ["Quotation conversion", `${converted}/${quotes?.length ?? 0}`],
          [
            "Open orders",
            orders?.filter(
              (x) =>
                !["FULFILLED", "INVOICED", "CANCELLED", "CLOSED"].includes(
                  x.status,
                ),
            ).length ?? 0,
          ],
          [
            "Backorder/return attention",
            returns?.filter(
              (x) => !["POSTED", "REJECTED", "CANCELLED"].includes(x.status),
            ).length ?? 0,
          ],
        ].map(([k, v]) => (
          <article key={k} className="rounded-xl border p-4">
            <p className="text-sm text-subtle">{k}</p>
            <p className="mt-3 text-2xl font-semibold">{v}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          [
            "By product",
            aggregate(
              (line) =>
                `${line.product_variants?.products?.name} · ${line.product_variants?.name}`,
            ),
          ],
          [
            "By branch",
            aggregate((line) => line.sales_fulfillments.branches?.name ?? ""),
          ],
          [
            "By customer",
            aggregate(
              (line) => line.sales_fulfillments.customers?.display_name ?? "",
            ),
          ],
        ].map(([title, values]) => (
          <div
            key={title as string}
            className="rounded-xl border bg-surface p-4"
          >
            <h2 className="font-semibold">{title as string}</h2>
            <div className="mt-3 space-y-2">
              {(values as ReturnType<typeof aggregate>)
                .slice(0, 10)
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span>{label}</span>
                    <span className="text-right">
                      Revenue {value.revenue.toLocaleString()}
                      <br />
                      <small>
                        COGS {value.cost.toLocaleString()} · profit{" "}
                        {value.profit.toLocaleString()}
                      </small>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </section>
      <p className="rounded-xl bg-muted p-4 text-sm text-subtle">
        The export dataset supports analysis by date, product, variant,
        category, brand, branch and customer. Catalogue reference cost is never
        used for profit.
      </p>
    </div>
  );
}
