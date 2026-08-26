import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getOrganizationContext } from "@/features/organizations/context";
import { CustomerEditForm } from "@/features/sales/components/forms";
import { salesPermissions } from "@/features/sales/queries";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const { client, organization } = await getOrganizationContext();
  const permissions = await salesPermissions();
  const [{ data: customer }, { data: priceLists }] = await Promise.all([
    client.from("customers").select("*").eq("id", customerId).maybeSingle(),
    client
      .from("price_lists")
      .select("id,name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
  ]);
  if (!customer) notFound();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales / Customers"
        title={`Edit ${customer.display_name}`}
        description="Maintain identity, commercial defaults and authorized credit controls."
      />
      <CustomerEditForm
        customerId={customer.id}
        customer={customer}
        currency={organization.currency_code}
        priceLists={(priceLists ?? []).map((item) => ({
          id: item.id,
          label: item.name,
        }))}
        canManageCredit={permissions["customers.credit_manage"]}
      />
    </div>
  );
}
