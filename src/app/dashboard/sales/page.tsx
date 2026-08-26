import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
import { salesPermissions } from "@/features/sales/queries";

function quoteExpiryWindow() {
  return new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
}

export default async function SalesDashboard() {
  const { client, organization } = await getOrganizationContext();
  const permissions = await salesPermissions();
  const [
    { count: quotes },
    { data: orders },
    { data: fulfilments },
    { data: receivables },
    { count: returns },
    { count: credits },
    { data: invoices },
    { count: expiringQuotes },
  ] = await Promise.all([
    client
      .from("sales_quotations")
      .select("id", { count: "exact", head: true })
      .in("status", [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "SENT",
        "ACCEPTED",
      ]),
    client
      .from("sales_orders")
      .select(
        "base_currency_total,status,sales_order_lines(reserved_base_quantity,backordered_base_quantity)",
      ),
    client
      .from("sales_fulfillment_lines")
      .select("revenue_base,gross_profit_base,sales_fulfillments!inner(status)")
      .eq("sales_fulfillments.status", "POSTED"),
    client.from("customer_receivables").select("outstanding_base,overdue_base"),
    client
      .from("sales_returns")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(POSTED,CANCELLED,REJECTED)"),
    client
      .from("customer_credit_notes")
      .select("id", { count: "exact", head: true })
      .eq("status", "ISSUED"),
    client
      .from("customer_invoices")
      .select("base_currency_total,status,due_date")
      .not("status", "in", "(DRAFT,VOID)"),
    client
      .from("sales_quotations")
      .select("id", { count: "exact", head: true })
      .in("status", ["APPROVED", "SENT"])
      .lte("expiry_date", quoteExpiryWindow()),
  ]);
  const open = (orders ?? []).filter(
    (x) => !["FULFILLED", "INVOICED", "CANCELLED", "CLOSED"].includes(x.status),
  );
  const sum = (xs: Array<Record<string, unknown>>, key: string) =>
    xs.reduce<number>(
      (n, x) => n + Number((x as Record<string, unknown>)[key] ?? 0),
      0,
    );
  const reserved = (orders ?? [])
      .flatMap((x) => x.sales_order_lines)
      .reduce((n, x) => n + Number(x.reserved_base_quantity), 0),
    backorders = (orders ?? []).filter((x) =>
      x.sales_order_lines.some((l) => Number(l.backordered_base_quantity) > 0),
    ).length;
  const metrics = [
    ["Quotes open", quotes ?? 0],
    ["Sales Orders open", open.length],
    [
      `Open order value (${organization.currency_code})`,
      sum(open, "base_currency_total").toLocaleString(),
    ],
    ["Reserved quantity", reserved.toLocaleString()],
    ["Backordered orders", backorders],
    [
      "Fulfilled Sales",
      sum(fulfilments ?? [], "revenue_base").toLocaleString(),
    ],
    [
      "Invoiced revenue",
      sum(invoices ?? [], "base_currency_total").toLocaleString(),
    ],
    [
      "Gross profit",
      permissions["sales.reports_view"]
        ? sum(fulfilments ?? [], "gross_profit_base").toLocaleString()
        : "Restricted",
    ],
    [
      "Outstanding receivables",
      permissions["receivables.view"]
        ? sum(receivables ?? [], "outstanding_base").toLocaleString()
        : "Restricted",
    ],
    [
      "Overdue receivables",
      permissions["receivables.view"]
        ? sum(receivables ?? [], "overdue_base").toLocaleString()
        : "Restricted",
    ],
    ["Pending returns", returns ?? 0],
    ["Credit Notes", credits ?? 0],
  ];
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Sales operations"
        description="Quotations, reservations, fulfilment, invoicing and receivables driven by authoritative database workflows."
        actions={
          <Link
            href="/dashboard/sales/orders/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            New Sales Order
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-surface p-5">
            <p className="text-sm text-subtle">{label}</p>
            <p className="mt-5 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl border bg-surface p-5">
        <h2 className="font-semibold">Attention required</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <p>{expiringQuotes ?? 0} quotations expiring soon</p>
          <p>{open.length} orders awaiting completion</p>
          <p>{backorders} orders with backorders</p>
          <p>
            {
              (receivables ?? []).filter(
                (item) => Number(item.overdue_base) > 0,
              ).length
            }{" "}
            customers overdue
          </p>
          <p>{returns ?? 0} returns pending</p>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Customers", "customers"],
          ["Quotations", "quotations"],
          ["Sales Orders", "orders"],
          ["Fulfilments", "fulfilments"],
          ["Invoices", "invoices"],
          ["Receivables", "receivables"],
          ["Returns", "returns"],
          ["Credit Notes", "credit-notes"],
          ["Reports", "reports"],
        ].map(([label, path]) => (
          <Link
            key={path}
            href={`/dashboard/sales/${path}`}
            className="rounded-xl border bg-surface p-4 font-semibold"
          >
            {label} &rarr;
          </Link>
        ))}
      </section>
    </div>
  );
}
