import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrganizationContext } from "@/features/organizations/context";
import { InspectionForm } from "@/features/sales/components/forms";
import { postReturn } from "@/features/sales/actions";
import { salesFormData } from "@/features/sales/queries";

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ returnId: string }>;
}) {
  const { returnId } = await params;
  const { client } = await getOrganizationContext();
  const data = await salesFormData();
  const { data: item } = await client
    .from("sales_returns")
    .select(
      "*,customers(display_name),sales_fulfillments(fulfilment_number),customer_invoices(invoice_number),customer_credit_notes!sales_returns_credit_note_fk(credit_note_number),inventory_transactions(transaction_number),sales_return_lines(*,product_variants(name,products(name)))",
    )
    .eq("id", returnId)
    .maybeSingle();
  if (!item) notFound();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales Return"
        title={item.return_number}
        description={`${item.customers?.display_name} · ${item.status} · original fulfilment ${item.sales_fulfillments?.fulfilment_number}`}
      />
      <section className="grid gap-3 rounded-2xl border bg-surface p-5 sm:grid-cols-3">
        <p>
          Invoice
          <br />
          <strong>
            {item.customer_invoices?.invoice_number ?? "Not linked"}
          </strong>
        </p>
        <p>
          Inventory transaction
          <br />
          <strong>
            {item.inventory_transactions?.transaction_number ??
              "No stock effect"}
          </strong>
        </p>
        <p>
          Credit Note
          <br />
          <strong>
            {item.customer_credit_notes?.credit_note_number ?? "Not issued"}
          </strong>
        </p>
      </section>
      <div className="space-y-3">
        {item.sales_return_lines.map((line) => (
          <article key={line.id} className="rounded-xl border p-4">
            <strong>
              {line.product_variants?.products?.name} ·{" "}
              {line.product_variants?.name}
            </strong>
            <p className="mt-1 text-sm text-subtle">
              Requested {line.requested_quantity} · received{" "}
              {line.received_quantity} · accepted {line.accepted_quantity} ·
              rejected {line.rejected_quantity} · disposition{" "}
              {line.disposition ?? "Pending"}
            </p>
            {["REQUESTED", "APPROVED", "RECEIVED"].includes(item.status) && (
              <div className="mt-4">
                <InspectionForm
                  returnId={item.id}
                  lineId={line.id}
                  locations={data.locations
                    .filter((location) => location.branch_id === item.branch_id)
                    .map((location) => ({
                      id: location.id,
                      label: location.name,
                    }))}
                />
              </div>
            )}
          </article>
        ))}
      </div>
      {item.status === "INSPECTED" && (
        <form action={postReturn.bind(null, item.id)}>
          <Button>Post return and linked Credit Note</Button>
        </form>
      )}
      {item.credit_note_id && (
        <Link
          href={`/dashboard/sales/credit-notes/${item.credit_note_id}`}
          className="inline-flex rounded-xl border px-4 py-2 font-semibold"
        >
          View Credit Note
        </Link>
      )}
    </div>
  );
}
