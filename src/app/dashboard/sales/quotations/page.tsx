import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizationContext } from "@/features/organizations/context";
export default async function Quotations({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const q = await searchParams,
    page = Math.max(Number(q.page) || 1, 1),
    from = (page - 1) * 25;
  const { client } = await getOrganizationContext();
  let req = client
    .from("sales_quotations")
    .select(
      "id,quotation_number,quotation_date,expiry_date,status,total,currency,customers(display_name),branches(name)",
      { count: "exact" },
    )
    .order("quotation_date", { ascending: false })
    .range(from, from + 24);
  if (q.status) req = req.eq("status", q.status);
  const { data, count } = await req;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Quotations"
        description="Prices and tax are historical snapshots; quotation availability is informational only."
        actions={
          <Link
            href="/dashboard/sales/quotations/new"
            className="rounded-xl bg-accent px-4 py-2 text-white"
          >
            New quotation
          </Link>
        }
      />
      <form>
        <select
          name="status"
          defaultValue={q.status}
          className="min-h-11 rounded-xl border px-3"
        >
          <option value="">All statuses</option>
          {[
            "DRAFT",
            "PENDING_APPROVAL",
            "APPROVED",
            "SENT",
            "ACCEPTED",
            "REJECTED",
            "EXPIRED",
            "CONVERTED",
            "CANCELLED",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="ml-3 rounded-xl bg-ink px-4 py-2 text-white">
          Filter
        </button>
      </form>
      {data?.length ? (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                {[
                  "Quotation",
                  "Customer",
                  "Branch",
                  "Date / expiry",
                  "Total",
                  "Status",
                ].map((x) => (
                  <th key={x} className="p-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="p-3">
                    <Link
                      className="font-mono font-semibold"
                      href={`/dashboard/sales/quotations/${x.id}`}
                    >
                      {x.quotation_number}
                    </Link>
                  </td>
                  <td className="p-3">{x.customers?.display_name}</td>
                  <td className="p-3">{x.branches?.name}</td>
                  <td className="p-3">
                    {x.quotation_date} / {x.expiry_date || "open"}
                  </td>
                  <td className="p-3">
                    {x.currency} {x.total}
                  </td>
                  <td className="p-3">{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No quotations"
          description="Create the first customer quotation."
        />
      )}
      <p className="text-sm text-subtle">
        Page {page} · {count ?? 0} quotations
      </p>
    </div>
  );
}
