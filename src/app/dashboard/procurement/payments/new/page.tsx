import { PageHeader } from "@/components/ui/page-header";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { paymentFormData } from "@/features/payments/queries";
import { postSupplierPayment } from "@/features/payments/actions";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function NewSupplierPayment({searchParams}:{searchParams:Promise<{error?:string}>}) {const query=await searchParams;await requireOrganizationPermission("payments.supplier.create");const data=await paymentFormData("SUPPLIER");return <div className="space-y-7"><PageHeader eyebrow="Procurement / Payments" title="Record supplier payment" description="Post a supplier settlement and allocate it across approved matching-currency invoices."/>{query.error&&<p className="rounded-xl border border-danger p-3 text-danger">{query.error}</p>}<PaymentForm kind="supplier" action={postSupplierPayment} parties={data.parties} branches={data.branches.map(x=>({id:x.id,label:x.name}))} accounts={data.accounts} methods={data.methods} invoices={data.invoices} currency={data.currency}/></div>;}
