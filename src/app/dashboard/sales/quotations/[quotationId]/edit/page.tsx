import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
import { QuotationEditForm } from "@/features/sales/components/forms";

function formattedAddress(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const formatted = (value as { formatted?: unknown }).formatted;
  return typeof formatted === "string" ? formatted : "";
}

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ quotationId: string }>;
}) {
  const { quotationId } = await params;
  const { client } = await getOrganizationContext();
  const { data: quotation } = await client
    .from("sales_quotations")
    .select("*,sales_quotation_lines(*,product_variant_packaging(name))")
    .eq("id", quotationId)
    .maybeSingle();
  if (!quotation) notFound();
  if (
    !["DRAFT", "REJECTED"].includes(quotation.status) ||
    !quotation.price_list_id
  )
    notFound();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales / Quotations"
        title={`Edit ${quotation.quotation_number}`}
        description="Only draft or rejected quotations can be changed. Pricing and discount permissions are enforced by PostgreSQL."
      />
      <QuotationEditForm
        quotationId={quotation.id}
        branchId={quotation.branch_id}
        priceListId={quotation.price_list_id}
        expiryDate={quotation.expiry_date}
        billingAddress={formattedAddress(quotation.billing_address_snapshot)}
        deliveryAddress={formattedAddress(quotation.delivery_address_snapshot)}
        notes={quotation.notes}
        terms={quotation.terms}
        lines={quotation.sales_quotation_lines.map((line) => ({
          variantId: line.product_variant_id,
          packagingId: line.packaging_id,
          label: line.description_snapshot,
          packaging: line.product_variant_packaging?.name ?? "Packaging",
          sku: line.sku_snapshot,
          price: Number(line.unit_price),
          available: 0,
          quantity: Number(line.entered_quantity),
          unit_price: Number(line.unit_price),
          discount: Number(line.discount),
          tax: Number(line.tax),
        }))}
      />
    </div>
  );
}
