import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { submitRequisition } from "@/features/procurement/actions";
import { RequisitionForm } from "@/features/procurement/components/forms";
import { procurementFormData } from "@/features/procurement/queries";
export default async function Requisitions() {
  const d = await procurementFormData();
  const { data } = await d.client
    .from("purchase_requisitions")
    .select(
      "id,requisition_number,status,priority,required_by_date,branches!purchase_requisitions_requesting_branch_id_fkey(name),purchase_requisition_lines(id,requested_quantity,product_variants(name,products(name)))",
    )
    .order("created_at", { ascending: false })
    .range(0, 99);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Procurement"
        title="Purchase requisitions"
        description="Internal demand with server-authorized approval transitions."
      />
      <RequisitionForm branches={d.branches} variants={d.variants} />
      <div className="space-y-3">
        {data?.map((x) => (
          <article
            key={x.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-surface p-4"
          >
            <div>
              <strong className="font-mono">{x.requisition_number}</strong>
              <p className="text-sm text-subtle">
                    {x.branches?.[0]?.name} · {x.priority} ·{" "}
                {x.purchase_requisition_lines.length} line(s)
              </p>
            </div>
            <span>{x.status}</span>
            {x.status === "DRAFT" && (
              <form action={submitRequisition.bind(null, x.id)}>
                <Button>Submit</Button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
