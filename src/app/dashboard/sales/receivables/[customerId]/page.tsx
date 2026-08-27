import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { PrintButton } from "@/features/sales/components/print-button";

export default async function CustomerStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { customerId } = await params;
  const filters = await searchParams;
  const { client, organization } = await requireOrganizationPermission(
    "receivables.statement_view",
  );
  const { data: customer } = await client
    .from("customers")
    .select("id,customer_code,display_name")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) notFound();
  let statementRequest = client
    .from("customer_statement_transactions")
    .select("transaction_date,document_type,document_id,document_number,debit_base,credit_base")
    .eq("customer_id", customerId);
  if (filters.from) statementRequest = statementRequest.gte("transaction_date", filters.from);
  if (filters.to) statementRequest = statementRequest.lte("transaction_date", filters.to);
  const { data: transactions } = await statementRequest;
  const entries = (transactions ?? []).map((item) => ({
    date: item.transaction_date ?? "",
    document: item.document_number ?? "",
    type: item.document_type,
    href:
      item.document_type === "INVOICE"
        ? `/dashboard/sales/invoices/${item.document_id}`
        : item.document_type === "CREDIT_NOTE"
          ? `/dashboard/sales/credit-notes/${item.document_id}`
          : item.document_type === "PAYMENT"
            ? `/dashboard/sales/payments/${item.document_id}`
            : "#",
    debit: Number(item.debit_base),
    credit: Number(item.credit_base),
  })).sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.document.localeCompare(b.document),
  );
  const rows = entries.reduce<
    Array<(typeof entries)[number] & { balance: number }>
  >((result, entry) => {
    const priorBalance = result.at(-1)?.balance ?? 0;
    return [
      ...result,
      { ...entry, balance: priorBalance + entry.debit - entry.credit },
    ];
  }, []);
  const exportHref = `/dashboard/sales/export?report=statement&customer=${customerId}&from=${filters.from ?? ""}&to=${filters.to ?? ""}`;
  return (
    <div className="space-y-7 print:p-0">
      <PageHeader
        eyebrow="Customer Statement"
        title={customer.display_name}
        description={`${customer.customer_code} · invoices, Credit Notes, customer payments, and posted refunds.`}
        actions={
          <div className="flex gap-2">
            <Link
              href={exportHref}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Export CSV
            </Link>
            <PrintButton label="Print statement" />
          </div>
        }
      />
      <form className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3 print:hidden">
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
          Apply dates
        </button>
      </form>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted">
            <tr>
              {["Date", "Document", "Debit", "Credit", "Balance"].map(
                (label) => (
                  <th key={label} className="p-3 text-left">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.document} className="border-t">
                <td className="p-3">{row.date}</td>
                <td className="p-3">
                  <Link href={row.href} className="font-mono font-semibold">
                    {row.document}
                  </Link>
                </td>
                <td className="p-3">{row.debit || "—"}</td>
                <td className="p-3">{row.credit || "—"}</td>
                <td className="p-3 font-semibold">
                  {organization.currency_code} {row.balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
