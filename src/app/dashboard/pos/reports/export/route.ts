import { requireOrganizationPermission } from "@/features/organizations/context";
const csv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  const { client, organization } =
    await requireOrganizationPermission("pos.reports.view");
  const { data } = await client
    .from("pos_receipts")
    .select(
      "receipt_number,completed_at,branch_name,terminal_name,customer_name,invoice_number,currency,subtotal,discount,tax,total,status",
    )
    .eq("organization_id", organization.id)
    .order("completed_at", { ascending: false })
    .limit(10000);
  const headers = [
    "receipt",
    "date",
    "branch",
    "terminal",
    "customer",
    "invoice",
    "currency",
    "subtotal",
    "discount",
    "tax",
    "total",
    "status",
  ];
  const rows = (data ?? []).map((x) => [
    x.receipt_number,
    x.completed_at,
    x.branch_name,
    x.terminal_name,
    x.customer_name,
    x.invoice_number,
    x.currency,
    x.subtotal,
    x.discount,
    x.tax,
    x.total,
    x.status,
  ]);
  return new Response(
    [headers, ...rows].map((row) => row.map(csv).join(",")).join("\r\n"),
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=pos-sales.csv",
      },
    },
  );
}
