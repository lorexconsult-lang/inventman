import { notFound } from "next/navigation";
import { DocumentBrand } from "@/components/brand/inventman-logo";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrganizationContext } from "@/features/organizations/context";
import { issueInvoice } from "@/features/sales/actions";
import { PrintButton } from "@/features/sales/components/print-button";
export default async function InvoiceDetail({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const id = (await params).invoiceId,
    { client, organization } = await getOrganizationContext();
  const { data: i } = await client
    .from("customer_invoices")
    .select(
      "*,customers(display_name,customer_code,email),branches(name),sales_orders(sales_order_number),customer_invoice_lines(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!i) notFound();
  const outstanding =
    Number(i.base_currency_total) -
    Number(i.credit_note_total_base) -
    Number(i.amount_paid_base);
  return (
    <div className="space-y-7 print:p-0">
      <DocumentBrand />
      <PageHeader
        eyebrow="Sales invoice"
        title={i.invoice_number}
        description={`${organization.name} · ${i.customers?.display_name} · ${i.status}`}
        actions={<PrintButton label="Print invoice" />}
      />
      <section className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-3">
        <p>
          Invoice date
          <br />
          <strong>{i.invoice_date}</strong>
        </p>
        <p>
          Due date
          <br />
          <strong>{i.due_date ?? "—"}</strong>
        </p>
        <p>
          Sales Order
          <br />
          <strong>{i.sales_orders?.sales_order_number ?? "Manual"}</strong>
        </p>
        <p>
          Currency
          <br />
          <strong>{i.currency}</strong>
        </p>
        <p>
          Total
          <br />
          <strong>{i.total}</strong>
        </p>
        <p>
          Outstanding base
          <br />
          <strong>{outstanding}</strong>
        </p>
      </section>
      <table className="w-full rounded-2xl border text-sm">
        <thead>
          <tr>
            {["Description", "Quantity", "Price", "Tax", "Total"].map((x) => (
              <th key={x} className="p-3 text-left">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {i.customer_invoice_lines.map((l) => (
            <tr className="border-t" key={l.id}>
              <td className="p-3">{l.description_snapshot}</td>
              <td className="p-3">{l.quantity}</td>
              <td className="p-3">{l.unit_price}</td>
              <td className="p-3">{l.tax}</td>
              <td className="p-3">{l.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {i.status === "DRAFT" && (
        <form className="print:hidden" action={issueInvoice.bind(null, id)}>
          <Button>Issue invoice</Button>
        </form>
      )}
      <p className="text-sm text-subtle print:hidden">
        Issuing this invoice changes Accounts Receivable only; inventory remains
        unchanged.
      </p>
    </div>
  );
}
