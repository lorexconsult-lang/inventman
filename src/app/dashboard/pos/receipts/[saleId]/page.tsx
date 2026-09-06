import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentBrand } from "@/components/brand/inventman-logo";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/ui/print-button";
import { reprintReceipt } from "@/features/pos/actions";
import { posReceiptData } from "@/features/pos/queries";

export default async function Receipt({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const id = (await params).saleId;
  const { receipt, lines } = await posReceiptData(id);
  if (!receipt) notFound();
  const settlements = Array.isArray(receipt.settlements)
    ? receipt.settlements
    : [];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/pos/receipts"
          className="rounded-xl border px-4 py-2 text-sm"
        >
          ← Receipts
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/sales/returns?invoiceId=${receipt.customer_invoice_id}`}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Start return
          </Link>
          <PrintButton label="Print receipt" />
        </div>
      </div>
      <article className="rounded-2xl border bg-white p-6 text-black print:border-0 print:p-0">
        <header className="border-b pb-4 text-center">
          <DocumentBrand className="mb-3 justify-center" />
          <p className="text-sm font-semibold">{receipt.branch_name}</p>
          <h1 className="mt-1 text-2xl font-bold">RECEIPT</h1>
          <p className="font-mono">{receipt.receipt_number}</p>
        </header>
        <div className="grid gap-2 border-b py-4 text-sm sm:grid-cols-2">
          <p>Customer: {receipt.customer_name}</p>
          <p>Invoice: {receipt.invoice_number}</p>
          <p>Terminal: {receipt.terminal_name}</p>
          <p>
            Date:{" "}
            {receipt.completed_at
              ? new Date(receipt.completed_at).toLocaleString()
              : "—"}
          </p>
        </div>
        <div className="divide-y">
          {lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm"
            >
              <span>
                {line.description_snapshot}
                <small className="block">
                  {line.ordered_quantity} × {receipt.currency} {line.unit_price}
                </small>
              </span>
              <span>
                {receipt.currency} {Number(line.line_total).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <dl className="ml-auto mt-4 max-w-sm space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>
              {receipt.currency} {Number(receipt.subtotal).toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>
              {receipt.currency} {Number(receipt.discount).toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>
              {receipt.currency} {Number(receipt.tax).toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <dt>Total</dt>
            <dd>
              {receipt.currency} {Number(receipt.total).toLocaleString()}
            </dd>
          </div>
          {settlements.map((item, index) => (
            <div className="flex justify-between" key={index}>
              <dt>
                {String(
                  (item as { method?: string; type?: string }).method ??
                    (item as { type?: string }).type,
                )}
              </dt>
              <dd>
                {receipt.currency}{" "}
                {Number(
                  (item as { amount?: number }).amount ?? 0,
                ).toLocaleString()}
              </dd>
            </div>
          ))}
          {Number(receipt.change_due) > 0 && (
            <div className="flex justify-between font-semibold">
              <dt>Change</dt>
              <dd>
                {receipt.currency} {Number(receipt.change_due).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-8 text-center text-xs">Thank you for your business.</p>
      </article>
      <form
        action={reprintReceipt.bind(null, id)}
        className="flex gap-2 print:hidden"
      >
        <input
          name="reason"
          required
          minLength={3}
          className="min-h-11 flex-1 rounded-xl border px-3"
          placeholder="Reason for reprint"
        />
        <Button>Record reprint</Button>
      </form>
    </div>
  );
}
