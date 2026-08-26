import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizationContext } from "@/features/organizations/context";
export default async function Credits() {
  const { client } = await getOrganizationContext();
  const { data } = await client
    .from("customer_credit_notes")
    .select(
      "*,customers(display_name),customer_invoices(invoice_number),sales_returns(return_number)",
    )
    .order("credit_date", { ascending: false })
    .range(0, 99);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Credit Notes"
        description="Financial Credits reduce AR. Only a linked Sales Return can restore inventory."
      />
      {!data?.length ? (
        <EmptyState
          title="No Credit Notes"
          description="Return-linked financial credits will appear here after an accepted Sales Return is posted."
        />
      ) : (
        <div className="grid gap-3">
          {data?.map((x) => (
            <Link
              href={`/dashboard/sales/credit-notes/${x.id}`}
              key={x.id}
              className="rounded-xl border p-4 print:border-0"
            >
              <div className="flex justify-between">
                <strong>
                  {x.credit_note_number} · {x.customers?.display_name}
                </strong>
                <span>{x.status}</span>
              </div>
              <p className="mt-2 text-sm">
                {x.currency} {x.total} · Invoice{" "}
                {x.customer_invoices?.invoice_number ?? "manual service credit"}{" "}
                · Inventory return {x.sales_returns?.return_number ?? "none"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
