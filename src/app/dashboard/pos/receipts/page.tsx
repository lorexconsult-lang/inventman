import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function PosReceipts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = await searchParams;
  const { client, organization } =
    await requireOrganizationPermission("pos.access");
  let request = client
    .from("pos_receipts")
    .select("*")
    .eq("organization_id", organization.id)
    .order("completed_at", { ascending: false })
    .limit(200);
  if (q.q)
    request = request.or(
      `receipt_number.ilike.%${q.q}%,invoice_number.ilike.%${q.q}%,customer_name.ilike.%${q.q}%`,
    );
  const { data } = await request;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="POS"
        title="Receipts"
        description="Search completed sales and open a printable receipt or linked return workflow."
      />
      <form>
        <input
          name="q"
          defaultValue={q.q}
          className="min-h-11 w-full max-w-lg rounded-xl border px-3"
          placeholder="Receipt, invoice, or customer"
        />
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {[
                "Receipt",
                "Customer",
                "Terminal",
                "Total",
                "Status",
                "Date",
              ].map((heading) => (
                <th className="p-3" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((receipt) => (
              <tr key={receipt.id} className="border-t">
                <td className="p-3">
                  <Link
                    className="font-mono font-semibold text-accent"
                    href={`/dashboard/pos/receipts/${receipt.id}`}
                  >
                    {receipt.receipt_number}
                  </Link>
                  <br />
                  <span className="text-xs text-subtle">
                    {receipt.invoice_number}
                  </span>
                </td>
                <td className="p-3">{receipt.customer_name}</td>
                <td className="p-3">
                  {receipt.branch_name} · {receipt.terminal_name}
                </td>
                <td className="p-3 font-mono">
                  {receipt.currency} {Number(receipt.total).toLocaleString()}
                </td>
                <td className="p-3">
                  <StatusBadge
                    tone={
                      receipt.status === "COMPLETED" ? "positive" : "neutral"
                    }
                  >
                    {receipt.status}
                  </StatusBadge>
                </td>
                <td className="p-3">
                  {receipt.completed_at
                    ? new Date(receipt.completed_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
