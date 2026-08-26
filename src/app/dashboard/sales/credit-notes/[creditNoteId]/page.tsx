import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
import { PrintButton } from "@/features/sales/components/print-button";

export default async function CreditNoteDetailPage({
  params,
}: {
  params: Promise<{ creditNoteId: string }>;
}) {
  const { creditNoteId } = await params;
  const { client, organization } = await getOrganizationContext();
  const { data: credit } = await client
    .from("customer_credit_notes")
    .select(
      "*,customers(display_name,customer_code),customer_invoices(id,invoice_number),sales_returns(id,return_number)",
    )
    .eq("id", creditNoteId)
    .maybeSingle();
  if (!credit) notFound();
  return (
    <div className="space-y-7 print:p-0">
      <PageHeader
        eyebrow="Credit Note"
        title={credit.credit_note_number}
        description={`${organization.name} · ${credit.customers?.display_name} · ${credit.status}`}
        actions={<PrintButton label="Print Credit Note" />}
      />
      <section className="grid gap-4 rounded-2xl border bg-surface p-5 sm:grid-cols-3">
        <p>
          Date
          <br />
          <strong>{credit.credit_date}</strong>
        </p>
        <p>
          Currency
          <br />
          <strong>{credit.currency}</strong>
        </p>
        <p>
          Total
          <br />
          <strong>{credit.total}</strong>
        </p>
        <p>
          Reason
          <br />
          <strong>{credit.reason}</strong>
        </p>
        <p>
          Invoice
          <br />
          {credit.customer_invoices ? (
            <Link
              href={`/dashboard/sales/invoices/${credit.customer_invoices.id}`}
              className="font-semibold underline"
            >
              {credit.customer_invoices.invoice_number}
            </Link>
          ) : (
            <strong>Not linked</strong>
          )}
        </p>
        <p>
          Stock Return
          <br />
          {credit.sales_returns ? (
            <Link
              href={`/dashboard/sales/returns/${credit.sales_returns.id}`}
              className="font-semibold underline"
            >
              {credit.sales_returns.return_number}
            </Link>
          ) : (
            <strong>None — no stock effect</strong>
          )}
        </p>
      </section>
      <p className="rounded-xl bg-muted p-4 text-sm text-subtle">
        This financial Credit reduces Accounts Receivable. It does not alter
        inventory independently.
      </p>
    </div>
  );
}
