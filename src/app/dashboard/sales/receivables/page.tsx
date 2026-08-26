import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";
export default async function Receivables({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; from?: string; to?: string }>;
}) {
  const filters = await searchParams;
  const { client, organization } =
    await requireOrganizationPermission("receivables.view");
  let request = client
    .from("customer_invoices")
    .select(
      "id,invoice_number,invoice_date,due_date,base_currency_total,credit_note_total_base,amount_paid_base,status,customers(id,display_name)",
    )
    .not("status", "in", "(DRAFT,VOID)");
  if (filters.customer) request = request.eq("customer_id", filters.customer);
  if (filters.from) request = request.gte("invoice_date", filters.from);
  if (filters.to) request = request.lte("invoice_date", filters.to);
  const { data } = await request.order("due_date");
  const today = new Date();
  const buckets = { Current: 0, "1–30": 0, "31–60": 0, "61–90": 0, "90+": 0 };
  for (const i of data ?? []) {
    const out =
        Number(i.base_currency_total) -
        Number(i.credit_note_total_base) -
        Number(i.amount_paid_base),
      days = i.due_date
        ? Math.floor(
            (today.getTime() - new Date(i.due_date).getTime()) / 86400000,
          )
        : -1;
    const key =
      days <= 0
        ? "Current"
        : days <= 30
          ? "1–30"
          : days <= 60
            ? "31–60"
            : days <= 90
              ? "61–90"
              : "90+";
    buckets[key] += out;
  }
  const totalOutstanding = Object.values(buckets).reduce(
    (sum, value) => sum + value,
    0,
  );
  const overdue = totalOutstanding - buckets.Current;
  const customers = new Map<
    string,
    { id: string; name: string; outstanding: number }
  >();
  for (const invoice of data ?? []) {
    if (!invoice.customers) continue;
    const outstanding =
      Number(invoice.base_currency_total) -
      Number(invoice.credit_note_total_base) -
      Number(invoice.amount_paid_base);
    const current = customers.get(invoice.customers.id) ?? {
      id: invoice.customers.id,
      name: invoice.customers.display_name,
      outstanding: 0,
    };
    current.outstanding += outstanding;
    customers.set(current.id, current);
  }
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales / Receivables"
        title="Accounts Receivable"
        description="Outstanding balances are derived from issued invoices and Credits. Payments are intentionally deferred."
        actions={
          <Link
            href={`/dashboard/sales/export?report=receivables&customer=${filters.customer ?? ""}&from=${filters.from ?? ""}&to=${filters.to ?? ""}`}
            className="rounded-xl border px-4 py-2"
          >
            Export CSV
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border p-4">
          <p className="text-sm text-subtle">Total outstanding</p>
          <p className="mt-3 text-2xl font-semibold">
            {organization.currency_code} {totalOutstanding.toLocaleString()}
          </p>
        </article>
        <article className="rounded-xl border p-4">
          <p className="text-sm text-subtle">Current</p>
          <p className="mt-3 text-2xl font-semibold">
            {organization.currency_code} {buckets.Current.toLocaleString()}
          </p>
        </article>
        <article className="rounded-xl border p-4">
          <p className="text-sm text-subtle">Overdue</p>
          <p className="mt-3 text-2xl font-semibold">
            {organization.currency_code} {overdue.toLocaleString()}
          </p>
        </article>
      </section>
      <form className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-4">
        <select
          name="customer"
          defaultValue={filters.customer ?? ""}
          className="min-h-11 rounded-xl border px-3"
        >
          <option value="">All customers</option>
          {[...customers.values()].map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
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
          Apply filters
        </button>
      </form>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(buckets).map(([k, v]) => (
          <article key={k} className="rounded-xl border p-4">
            <p className="text-sm text-subtle">{k}</p>
            <p className="mt-3 text-2xl font-semibold">
              {organization.currency_code} {v.toLocaleString()}
            </p>
          </article>
        ))}
      </section>
      <div className="space-y-2">
        {[...customers.values()].map((customer) => (
          <Link
            key={customer.id}
            href={`/dashboard/sales/receivables/${customer.id}`}
            className="flex justify-between rounded-xl border bg-surface p-4"
          >
            <span className="font-semibold">{customer.name}</span>
            <span>
              {organization.currency_code}{" "}
              {customer.outstanding.toLocaleString()} · Statement →
            </span>
          </Link>
        ))}
        {data?.map((i) => (
          <article
            key={i.id}
            className="flex flex-wrap justify-between rounded-xl border p-4"
          >
            <div>
              <Link
                href={`/dashboard/sales/invoices/${i.id}`}
                className="font-mono font-semibold"
              >
                {i.invoice_number}
              </Link>
              <p className="text-sm text-subtle">
                {i.customers?.display_name} · due {i.due_date ?? "not set"}
              </p>
            </div>
            <strong>
              {Number(i.base_currency_total) -
                Number(i.credit_note_total_base) -
                Number(i.amount_paid_base)}
            </strong>
          </article>
        ))}
      </div>
    </div>
  );
}
