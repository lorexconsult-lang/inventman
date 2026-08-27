import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function SettlementDashboard() {
  const { client, organization } = await requireOrganizationPermission("payments.reports.view");
  const today = new Date().toISOString().slice(0,10);
  const [{ data: payments }, { data: credits }, { data: advances }, { data: refunds }, { data: balances }] = await Promise.all([
    client.from("payments").select("direction,base_currency_amount,status").eq("payment_date",today).eq("is_reversal",false).neq("status","VOIDED"),
    client.from("customer_unapplied_credits").select("unapplied_amount").gt("unapplied_amount",0),
    client.from("supplier_advances").select("unapplied_amount").gt("unapplied_amount",0),
    client.from("customer_refunds").select("base_currency_amount,status"),
    client.from("operational_settlement_balances").select("account_id,name,currency,operational_balance"),
  ]);
  const sum=(values:Array<Record<string,unknown>>,key:string)=>values.reduce((n,x)=>n+Number(x[key]??0),0);
  const receipts=(payments??[]).filter(x=>x.direction==="RECEIPT"), supplier=(payments??[]).filter(x=>x.direction==="PAYMENT");
  return <div className="space-y-7"><PageHeader eyebrow="Payments & settlement" title="Settlement dashboard" description="Operational receipts, supplier payments, unapplied balances, refunds, and account movement. This is not full accounting cash flow." actions={<Link href="/dashboard/settings/payments" className="rounded-xl border px-4 py-2">Accounts & methods</Link>}/><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Customer receipts today",sum(receipts,"base_currency_amount")],["Supplier payments today",sum(supplier,"base_currency_amount")],["Unapplied customer credit",sum(credits??[],"unapplied_amount")],["Supplier advances",sum(advances??[],"unapplied_amount")],["Refunds pending",sum((refunds??[]).filter(x=>x.status==="PENDING_APPROVAL"),"base_currency_amount")],["Refunds posted",sum((refunds??[]).filter(x=>x.status==="POSTED"),"base_currency_amount")]].map(([label,value])=><article key={label} className="rounded-xl border bg-surface p-4"><p className="text-sm text-subtle">{label}</p><p className="mt-3 text-2xl font-semibold">{organization.currency_code} {Number(value).toLocaleString()}</p></article>)}</section><section><h2 className="mb-3 text-lg font-semibold">Operational settlement balances</h2><div className="grid gap-3 md:grid-cols-2">{balances?.map(x=><article key={x.account_id} className="rounded-xl border p-4"><strong>{x.name}</strong><p className="mt-2 text-xl">{x.currency} {Number(x.operational_balance).toLocaleString()}</p></article>)}</div></section><div className="grid gap-3 sm:grid-cols-2"><Link href="/dashboard/sales/payments" className="rounded-xl border bg-surface p-5 font-semibold">Customer payments →</Link><Link href="/dashboard/procurement/payments" className="rounded-xl border bg-surface p-5 font-semibold">Supplier payments →</Link></div></div>;
}
