import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function PosReports() {
  const { client, organization } =
    await requireOrganizationPermission("pos.reports.view");
  const [{ data: daily }, { data: sessions }, { data: settlements }] =
    await Promise.all([
      client
        .from("pos_daily_summary")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sale_date", { ascending: false })
        .limit(90),
      client
        .from("pos_session_summaries")
        .select("status,variance,sales_total,transaction_count")
        .eq("organization_id", organization.id)
        .limit(500),
      client
        .from("pos_sale_settlements")
        .select(
          "amount,payment_methods(name,method_type),pos_sales!inner(organization_id,status)",
        )
        .eq("pos_sales.organization_id", organization.id)
        .neq("pos_sales.status", "VOIDED"),
    ]);
  const sales = (daily ?? []).reduce((n, x) => n + Number(x.gross_sales), 0);
  const variance = (sessions ?? []).reduce(
    (n, x) => n + Number(x.variance ?? 0),
    0,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="POS"
        title="Operations reports"
        description="Sales, tender mix, sessions, discounts, and cash variances. These are operational reports, not a General Ledger."
        actions={
          <Link
            href="/dashboard/pos/reports/export"
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Export CSV
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Gross sales", sales],
          [
            "Transactions",
            (daily ?? []).reduce((n, x) => n + Number(x.transaction_count), 0),
          ],
          ["Cash variance", variance],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl border bg-surface p-5"
          >
            <p className="text-sm text-subtle">{label}</p>
            <p className="mt-4 text-2xl font-semibold">
              {Number(value).toLocaleString()}
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border bg-surface p-5">
          <h2 className="font-semibold">Daily sales</h2>
          <div className="mt-4 space-y-3">
            {daily?.map((x) => (
              <div
                key={`${x.branch_id}-${x.sale_date}`}
                className="flex justify-between border-b pb-2 text-sm"
              >
                <span>
                  {x.sale_date} · {x.transaction_count} sales
                </span>
                <span>
                  {x.currency} {Number(x.gross_sales).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border bg-surface p-5">
          <h2 className="font-semibold">Tender mix</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(
              (settlements ?? []).reduce<Record<string, number>>(
                (result, x) => {
                  const name = x.payment_methods?.name ?? "Customer credit";
                  result[name] = (result[name] ?? 0) + Number(x.amount);
                  return result;
                },
                {},
              ),
            ).map(([name, value]) => (
              <div
                className="flex justify-between border-b pb-2 text-sm"
                key={name}
              >
                <span>{name}</span>
                <span>{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
