import { PageHeader } from "@/components/ui/page-header";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { paymentFormData } from "@/features/payments/queries";
import { postCustomerPayment } from "@/features/payments/actions";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function NewCustomerPayment({searchParams}:{searchParams:Promise<{error?:string}>}) { const query=await searchParams; await requireOrganizationPermission("payments.customer.create"); const data=await paymentFormData("CUSTOMER"); return <div className="space-y-7"><PageHeader eyebrow="Sales / Payments" title="Record customer payment" description="Post a receipt and optionally allocate it across one or more matching-currency invoices."/>{query.error&&<p className="rounded-xl border border-danger p-3 text-danger">{query.error}</p>}<PaymentForm kind="customer" action={postCustomerPayment} parties={data.parties} branches={data.branches.map(x=>({id:x.id,label:x.name}))} accounts={data.accounts} methods={data.methods} invoices={data.invoices} currency={data.currency}/></div>; }
