import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrganizationContext } from "@/features/organizations/context";
import { PrintButton } from "@/features/sales/components/print-button";
import { salesFormData, salesPermissions } from "@/features/sales/queries";
import {
  convertQuotation,
  transitionQuotation,
} from "@/features/sales/actions";
export default async function QuoteDetail({
  params,
}: {
  params: Promise<{ quotationId: string }>;
}) {
  const id = (await params).quotationId,
    { client } = await getOrganizationContext(),
    d = await salesFormData(),
    permissions = await salesPermissions();
  const { data: q } = await client
    .from("sales_quotations")
    .select(
      "*,customers(display_name,customer_code),branches(name),sales_quotation_lines(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();
  const warehouse = d.warehouses.find((x) => x.branch_id === q.branch_id),
    location = d.locations.find((x) => x.warehouse_id === warehouse?.id);
  return (
    <div className="space-y-7 print:p-0">
      <PageHeader
        eyebrow="Sales quotation"
        title={q.quotation_number}
        description={`${q.customers?.display_name} · ${q.status} · valid until ${q.expiry_date || "not specified"}`}
        actions={
          <div className="flex gap-2 print:hidden">
            {["DRAFT", "REJECTED"].includes(q.status) && (
              <Link
                href={`/dashboard/sales/quotations/${id}/edit`}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Edit
              </Link>
            )}
            <PrintButton label="Print quotation" />
          </div>
        }
      />
      <section className="rounded-2xl border bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <p>
            Branch <strong>{q.branches?.name}</strong>
          </p>
          <p>
            Currency <strong>{q.currency}</strong>
          </p>
          <p>
            Total <strong>{q.total}</strong>
          </p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr>
                {[
                  "Product",
                  "Quantity",
                  "Price",
                  "Discount",
                  "Tax",
                  "Total",
                ].map((x) => (
                  <th className="p-2 text-left" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.sales_quotation_lines.map((l) => (
                <tr className="border-t" key={l.id}>
                  <td className="p-2">
                    {l.description_snapshot}
                    <br />
                    <small>{l.sku_snapshot}</small>
                  </td>
                  <td className="p-2">{l.entered_quantity}</td>
                  <td className="p-2">{l.unit_price}</td>
                  <td className="p-2">{l.discount}</td>
                  <td className="p-2">{l.tax}</td>
                  <td className="p-2">{l.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="flex flex-wrap gap-2 print:hidden">
        {q.status === "DRAFT" && (
          <form action={transitionQuotation.bind(null, id, "SUBMIT")}>
            <Button>Submit</Button>
          </form>
        )}
        {q.status === "PENDING_APPROVAL" &&
          permissions["sales.quotation_approve"] && (
            <>
              <form action={transitionQuotation.bind(null, id, "APPROVE")}>
                <Button>Approve</Button>
              </form>
              <form action={transitionQuotation.bind(null, id, "REJECT")}>
                <Button variant="secondary">Reject</Button>
              </form>
            </>
          )}
        {["APPROVED", "SENT"].includes(q.status) && (
          <form action={transitionQuotation.bind(null, id, "ACCEPT")}>
            <Button>Accept</Button>
          </form>
        )}
        {["APPROVED", "SENT", "ACCEPTED"].includes(q.status) &&
          warehouse &&
          location && (
            <form
              action={convertQuotation.bind(
                null,
                id,
                warehouse.id,
                location.id,
              )}
            >
              <Button>Convert to Sales Order</Button>
            </form>
          )}
        {!["CONVERTED", "CANCELLED"].includes(q.status) && (
          <form action={transitionQuotation.bind(null, id, "CANCEL")}>
            <Button variant="secondary">Cancel</Button>
          </form>
        )}
      </div>
    </div>
  );
}
