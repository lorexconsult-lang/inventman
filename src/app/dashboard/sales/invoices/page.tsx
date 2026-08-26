import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
export default async function Invoices() {
  const { client } = await getOrganizationContext();
  const { data } = await client
    .from("customer_invoices")
    .select(
      "id,invoice_number,invoice_date,due_date,status,total,currency,base_currency_total,credit_note_total_base,amount_paid_base,customers(display_name),sales_orders(sales_order_number)",
    )
    .order("invoice_date", { ascending: false })
    .range(0, 99);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Customer invoices"
        description="Invoices create receivables and never post stock."
      />
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-muted">
            <tr>
              {[
                "Invoice",
                "Customer",
                "Sales Order",
                "Date",
                "Due",
                "Total",
                "Outstanding",
                "Status",
              ].map((x) => (
                <th key={x} className="p-3 text-left">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((x) => (
              <tr key={x.id} className="border-t">
                <td className="p-3">
                  <Link
                    href={`/dashboard/sales/invoices/${x.id}`}
                    className="font-mono font-semibold"
                  >
                    {x.invoice_number}
                  </Link>
                </td>
                <td className="p-3">{x.customers?.display_name}</td>
                <td className="p-3">
                  {x.sales_orders?.sales_order_number ?? "Manual"}
                </td>
                <td className="p-3">{x.invoice_date}</td>
                <td className="p-3">{x.due_date ?? "—"}</td>
                <td className="p-3">
                  {x.currency} {x.total}
                </td>
                <td className="p-3">
                  {Number(x.base_currency_total) -
                    Number(x.credit_note_total_base) -
                    Number(x.amount_paid_base)}
                </td>
                <td className="p-3">{x.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
