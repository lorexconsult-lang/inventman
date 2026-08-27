import { requireOrganizationPermission } from "@/features/organizations/context";
const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const report = search.get("report") ?? "sales";
  const customer = search.get("customer") || null;
  const from = search.get("from") || null;
  const to = search.get("to") || null;
  const { client } = await requireOrganizationPermission(
    report === "statement"
      ? "receivables.statement_view"
      : report === "receivables"
        ? "receivables.view"
        : "sales.reports_view",
  );
  let rows: unknown[][];
  if (report === "statement" && customer) {
    let statement = client
      .from("customer_statement_transactions")
      .select("transaction_date,document_number,debit_base,credit_base")
      .eq("customer_id", customer);
    if (from) statement = statement.gte("transaction_date", from);
    if (to) statement = statement.lte("transaction_date", to);
    const { data } = await statement;
    const entries = (data ?? []).map((item) => ({
      date: item.transaction_date ?? "",
      document: item.document_number ?? "",
      debit: Number(item.debit_base),
      credit: Number(item.credit_base),
    })).sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.document.localeCompare(b.document),
    );
    let balance = 0;
    rows = [
      ["date", "document", "debit", "credit", "balance"],
      ...entries.map((entry) => [
        entry.date,
        entry.document,
        entry.debit,
        entry.credit,
        (balance += entry.debit - entry.credit),
      ]),
    ];
  } else if (report === "receivables") {
    let query = client
      .from("customer_invoice_settlement")
      .select(
        "invoice_number,invoice_date,due_date,status,base_currency_total,credit_allocated_base,payment_allocated_base,outstanding_base,customers(display_name)",
      )
      .not("status", "in", "(DRAFT,VOID)");
    if (customer) query = query.eq("customer_id", customer);
    if (from) query = query.gte("invoice_date", from);
    if (to) query = query.lte("invoice_date", to);
    const { data } = await query.limit(10000);
    rows = [
      [
        "invoice",
        "customer",
        "date",
        "due",
        "status",
        "debit",
        "credits",
        "payments",
        "outstanding",
      ],
      ...(data ?? []).map((x) => [
        x.invoice_number,
        x.customers?.display_name,
        x.invoice_date,
        x.due_date,
        x.status,
        x.base_currency_total,
        x.credit_allocated_base,
        x.payment_allocated_base,
        x.outstanding_base,
      ]),
    ];
  } else {
    let query = client
      .from("sales_fulfillment_lines")
      .select(
        "base_quantity,revenue_base,inventory_cost_base,gross_profit_base,product_variants(name,sku,products(name,product_categories(name),brands(name))),sales_fulfillments!inner(fulfilled_at,status,fulfilment_number,branches(name),customers(display_name))",
      )
      .eq("sales_fulfillments.status", "POSTED");
    if (from) query = query.gte("sales_fulfillments.fulfilled_at", from);
    if (to)
      query = query.lte(
        "sales_fulfillments.fulfilled_at",
        `${to}T23:59:59.999Z`,
      );
    const { data } = await query.limit(10000);
    rows = [
      [
        "date",
        "fulfilment",
        "customer",
        "branch",
        "product",
        "variant",
        "sku",
        "category",
        "brand",
        "quantity",
        "revenue",
        "cogs",
        "gross_profit",
      ],
      ...(data ?? []).map((x) => [
        x.sales_fulfillments.fulfilled_at,
        x.sales_fulfillments.fulfilment_number,
        x.sales_fulfillments.customers?.display_name,
        x.sales_fulfillments.branches?.name,
        x.product_variants?.products?.name,
        x.product_variants?.name,
        x.product_variants?.sku,
        x.product_variants?.products?.product_categories?.name,
        x.product_variants?.products?.brands?.name,
        x.base_quantity,
        x.revenue_base,
        x.inventory_cost_base,
        x.gross_profit_base,
      ]),
    ];
  }
  return new Response(rows.map((r) => r.map(esc).join(",")).join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=sales-${report}.csv`,
    },
  });
}
