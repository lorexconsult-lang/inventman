import { Button } from "@/components/ui/button";

type Option = { id: string; label: string };
type Invoice = { id: string; invoice_number: string; currency: string; outstanding_base: number; customer_id?: string; supplier_id?: string };

export function PaymentForm({ kind, action, parties, branches, accounts, methods, invoices, currency }: {
  kind: "customer" | "supplier";
  action: (form: FormData) => void;
  parties: Array<Option & { currency: string }>;
  branches: Option[];
  accounts: Array<{ id: string; name: string; currency: string; branch_id: string | null }>;
  methods: Array<{ id: string; name: string; branch_id: string | null; default_account_id: string | null; requires_reference: boolean }>;
  invoices: Invoice[];
  currency: string;
}) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border bg-surface p-5">
      <input type="hidden" name="idempotencyKey" value={crypto.randomUUID()} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium">{kind === "customer" ? "Customer" : "Supplier"}<select required name="partyId" className="mt-1 min-h-11 w-full rounded-xl border px-3"><option value="">Choose</option>{parties.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <label className="text-sm font-medium">Branch<select required name="branchId" className="mt-1 min-h-11 w-full rounded-xl border px-3"><option value="">Choose</option>{branches.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <label className="text-sm font-medium">Payment date<input required name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="text-sm font-medium">Amount<input required name="amount" type="number" min="0.01" step="0.01" className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="text-sm font-medium">Currency<input required name="currency" defaultValue={currency} pattern="[A-Z]{3}" className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="text-sm font-medium">Exchange rate<input required name="exchangeRate" type="number" min="0.000001" step="0.000001" defaultValue="1" className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="text-sm font-medium">Payment method<select required name="methodId" className="mt-1 min-h-11 w-full rounded-xl border px-3"><option value="">Choose</option>{methods.map((x) => <option key={x.id} value={x.id}>{x.name}{x.requires_reference ? " (reference required)" : ""}</option>)}</select></label>
        <label className="text-sm font-medium">Settlement account<select required name="accountId" className="mt-1 min-h-11 w-full rounded-xl border px-3"><option value="">Choose</option>{accounts.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.currency}</option>)}</select></label>
        <label className="text-sm font-medium">External reference<input name="reference" autoComplete="off" className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="text-sm font-medium md:col-span-2">Notes<input name="notes" className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
      </div>
      <fieldset className="rounded-xl border p-4">
        <legend className="px-2 font-semibold">Manual invoice allocation</legend>
        <p className="mb-3 text-sm text-subtle">Leave amounts blank to retain unapplied credit or supplier advance. Payment and invoice currencies must match.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {invoices.map((invoice) => <label key={invoice.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span><strong>{invoice.invoice_number}</strong><span className="block text-subtle">Outstanding {invoice.currency} {Number(invoice.outstanding_base).toLocaleString()}</span></span><input aria-label={`Allocate to ${invoice.invoice_number}`} name={`allocation:${invoice.id}`} type="number" min="0" max={Number(invoice.outstanding_base)} step="0.01" className="w-32 rounded-lg border px-3 py-2" /></label>)}
        </div>
      </fieldset>
      <Button>Post {kind} payment</Button>
    </form>
  );
}
