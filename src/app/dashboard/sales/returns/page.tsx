import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizationContext } from "@/features/organizations/context";
import { salesFormData } from "@/features/sales/queries";
import { ReturnForm } from "@/features/sales/components/forms";

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ fulfilment?: string }>;
}) {
  const query = await searchParams;
  const { client } = await getOrganizationContext();
  const formData = await salesFormData();
  const [{ data: returns }, { data: fulfilments }] = await Promise.all([
    client
      .from("sales_returns")
      .select(
        "id,return_number,status,return_date,customers(display_name),sales_fulfillments(fulfilment_number)",
      )
      .order("return_date", { ascending: false })
      .range(0, 99),
    client
      .from("sales_fulfillments")
      .select(
        "id,fulfilment_number,customer_id,customers(display_name),customer_invoices:customer_invoice_fulfillments(customer_invoices(id)),sales_fulfillment_lines(id,base_quantity,conversion_snapshot,product_variants(name,products(name)))",
      )
      .eq("status", "POSTED")
      .order("fulfilled_at", { ascending: false })
      .limit(50),
  ]);
  const selected = fulfilments?.find((item) => item.id === query.fulfilment);
  const lineIds =
    selected?.sales_fulfillment_lines.map((line) => line.id) ?? [];
  const prior = lineIds.length
    ? ((
        await client
          .from("sales_return_lines")
          .select(
            "sales_fulfillment_line_id,requested_quantity,sales_returns!inner(status)",
          )
          .in("sales_fulfillment_line_id", lineIds)
          .not("sales_returns.status", "in", "(REJECTED,CANCELLED)")
      ).data ?? [])
    : [];
  const priorByLine = new Map<string, number>();
  for (const item of prior)
    priorByLine.set(
      item.sales_fulfillment_line_id,
      (priorByLine.get(item.sales_fulfillment_line_id) ?? 0) +
        Number(item.requested_quantity),
    );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Sales Returns"
        description="A stock return and its financial Credit Note remain separate, linked documents."
      />
      <section className="space-y-3">
        <h2 className="font-semibold">Create return from posted fulfilment</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(fulfilments ?? []).map((item) => (
            <Link
              key={item.id}
              href={`?fulfilment=${item.id}`}
              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm ${selected?.id === item.id ? "bg-ink text-white" : "bg-surface"}`}
            >
              {item.fulfilment_number} · {item.customers?.display_name}
            </Link>
          ))}
        </div>
        {selected && (
          <ReturnForm
            fulfilmentId={selected.id}
            invoiceId={
              selected.customer_invoices?.[0]?.customer_invoices?.id ?? null
            }
            reasons={formData.reasons.map((item) => ({
              id: item.id,
              label: item.name,
            }))}
            lines={selected.sales_fulfillment_lines
              .map((line) => ({
                id: line.id,
                label: `${line.product_variants?.products?.name} · ${line.product_variants?.name}`,
                eligible: Math.max(
                  Number(line.base_quantity) - (priorByLine.get(line.id) ?? 0),
                  0,
                ),
                priorReturned: priorByLine.get(line.id) ?? 0,
                conversion: Number(line.conversion_snapshot),
              }))
              .filter((line) => line.eligible > 0)}
          />
        )}
      </section>
      {(returns ?? []).length === 0 ? (
        <EmptyState
          title="No Sales Returns"
          description="Posted fulfilments that are eligible for return can be selected above."
        />
      ) : (
        <div className="space-y-3">
          {returns?.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/sales/returns/${item.id}`}
              className="block rounded-xl border bg-surface p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  {item.return_number} · {item.customers?.display_name}
                </strong>
                <span>{item.status}</span>
              </div>
              <p className="mt-1 text-sm text-subtle">
                Original fulfilment {item.sales_fulfillments?.fulfilment_number}{" "}
                · {new Date(item.return_date).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
