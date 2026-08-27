"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Minus, Pause, Plus, ScanLine, Trash2 } from "lucide-react";
import { completeSale, holdCart, openSession } from "@/features/pos/actions";
import {
  cartTotals,
  type PosLine,
  type PosSettlement,
} from "@/features/pos/calculations";
import { Button } from "@/components/ui/button";

type Terminal = {
  id: string;
  name: string;
  terminal_code: string;
  branch_id: string;
  default_customer_id: string | null;
  default_cash_account_id: string;
  branches: { name: string } | null;
};
type Customer = {
  id: string;
  display_name: string;
  customer_code: string;
  default_price_list_id: string | null;
};
type Method = {
  id: string;
  name: string;
  method_type: string;
  branch_id: string | null;
  default_account_id: string | null;
  requires_reference: boolean;
};
type Account = {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  branch_id: string | null;
};
type CustomerCredit = {
  customer_id: string | null;
  source_id: string | null;
  source_type: string | null;
  document_number: string | null;
  currency: string | null;
  unapplied_amount: number | null;
};
type SearchItem = {
  variantId: string;
  packagingId: string;
  label: string;
  packaging: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  availableBase: number;
  conversion: number;
  taxRate: number;
};

export function PosRegister({
  terminals,
  sessions,
  customers,
  methods,
  accounts,
  held,
  credits,
  currency,
  checkoutKey,
}: {
  terminals: Terminal[];
  sessions: { id: string; terminal_id: string; session_number: string }[];
  customers: Customer[];
  methods: Method[];
  accounts: Account[];
  held: {
    id: string;
    session_id: string;
    customer_id: string | null;
    cart: unknown;
    notes: string | null;
  }[];
  credits: CustomerCredit[];
  currency: string;
  checkoutKey: string;
}) {
  const activeSession = sessions[0];
  const terminal =
    terminals.find((t) => t.id === activeSession?.terminal_id) ?? terminals[0];
  const [customerId, setCustomerId] = useState(
    terminal?.default_customer_id ?? customers[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [lines, setLines] = useState<PosLine[]>([]);
  const [payments, setPayments] = useState<
    { methodId: string; amount: number; tendered: number; reference: string }[]
  >([]);
  const [credit, setCredit] = useState(0);
  const [creditSourceId, setCreditSourceId] = useState("");
  const [storeCreditAmount, setStoreCreditAmount] = useState(0);
  const [heldCartId, setHeldCartId] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const totals = useMemo(() => cartTotals(lines), [lines]);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const response = await fetch(
        `/dashboard/pos/products/search?q=${encodeURIComponent(query)}&branchId=${terminal?.branch_id ?? ""}&customerId=${customerId}`,
        { signal: controller.signal },
      );
      if (response.ok) setResults((await response.json()) as SearchItem[]);
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, terminal?.branch_id, customerId]);
  const add = (item: SearchItem) => {
    setLines((current) => {
      const found = current.find(
        (x) =>
          x.variantId === item.variantId && x.packagingId === item.packagingId,
      );
      return found
        ? current.map((x) =>
            x === found ? { ...x, quantity: x.quantity + 1 } : x,
          )
        : [
            ...current,
            {
              ...item,
              quantity: 1,
              unitPrice: item.price,
              taxRate: item.taxRate,
              discount: 0,
            },
          ];
    });
    setQuery("");
    setResults([]);
    input.current?.focus();
  };
  const settlementTotal =
    payments.reduce((n, x) => n + Number(x.amount || 0), 0) +
    credit +
    storeCreditAmount;
  const remaining = Math.max(totals.total - settlementTotal, 0);
  if (!activeSession)
    return (
      <section className="mx-auto max-w-xl rounded-3xl border bg-surface p-6">
        <h2 className="text-xl font-semibold">Open a till session</h2>
        <p className="mt-2 text-sm text-subtle">
          Choose an assigned terminal and count the opening float before
          selling.
        </p>
        {terminals.length ? (
          <form action={openSession} className="mt-6 grid gap-4">
            <select
              name="terminalId"
              className="min-h-12 rounded-xl border px-3"
            >
              {terminals.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.branches?.name}
                </option>
              ))}
            </select>
            <input
              name="openingFloat"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className="min-h-12 rounded-xl border px-3"
              aria-label="Opening cash float"
            />
            <textarea
              name="notes"
              className="rounded-xl border p-3"
              placeholder="Opening note (optional)"
            />
            <Button>Open session</Button>
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-warning-soft p-4 text-sm">
            No active terminal is assigned to a branch you can access. Ask an
            administrator to configure one.
          </p>
        )}
      </section>
    );
  const linesPayload = lines.map((x) => ({
    product_variant_id: x.variantId,
    packaging_id: x.packagingId,
    quantity: x.quantity,
    unit_price: x.unitPrice,
    discount: x.discount,
    tax:
      Math.round(
        (x.quantity * x.unitPrice - x.discount) * (x.taxRate / 100) * 10000,
      ) / 10000,
  }));
  const cashSettlements: PosSettlement[] = payments
    .filter((x) => x.amount > 0)
    .map((x) => {
      const method = methods.find((m) => m.id === x.methodId);
      const account =
        method?.default_account_id ??
        accounts.find(
          (a) =>
            (!a.branch_id || a.branch_id === terminal?.branch_id) &&
            a.currency === currency,
        )?.id;
      return {
        sourceType: "PAYMENT",
        paymentMethodId: x.methodId,
        accountId: account,
        amount: x.amount,
        tenderedAmount:
          method?.method_type === "CASH" ? x.tendered || x.amount : undefined,
        reference: x.reference,
      };
    });
  const selectedCredit = credits.find(
    (item) => item.source_id === creditSourceId,
  );
  const settlements: PosSettlement[] = [
    ...cashSettlements,
    ...(selectedCredit && selectedCredit.source_id && storeCreditAmount > 0
      ? [
          {
            sourceType:
              selectedCredit.source_type === "CREDIT_NOTE"
                ? ("CREDIT_NOTE" as const)
                : ("UNAPPLIED_PAYMENT" as const),
            sourceId: selectedCredit.source_id,
            amount: storeCreditAmount,
          },
        ]
      : []),
  ];
  const availableCredits = credits.filter(
    (item) => item.customer_id === customerId && item.currency === currency,
  );
  return (
    <div className="grid min-h-[calc(100dvh-9rem)] gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <section className="min-w-0 rounded-2xl border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {terminal?.name} · {activeSession.session_number}
            </p>
            <h2 className="text-xl font-semibold">New sale</h2>
          </div>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="min-h-11 max-w-full rounded-xl border px-3"
            aria-label="Customer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name} · {c.customer_code}
              </option>
            ))}
          </select>
        </div>
        <div className="relative mt-4">
          <ScanLine className="absolute left-3 top-3.5 size-5 text-subtle" />
          <input
            ref={input}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                e.preventDefault();
                add(results[0]);
              }
            }}
            className="min-h-12 w-full rounded-xl border pl-11 pr-3 text-base"
            placeholder="Scan barcode or search product / SKU"
            aria-label="Scan barcode or search products"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-xl border bg-surface shadow-xl">
              {results.map((item) => (
                <button
                  key={`${item.variantId}-${item.packagingId}`}
                  onClick={() => add(item)}
                  className="flex w-full items-center justify-between gap-4 border-b p-3 text-left last:border-0 hover:bg-muted"
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small className="block text-subtle">
                      {item.sku} · {item.packaging} · available{" "}
                      {item.availableBase / item.conversion}
                    </small>
                  </span>
                  <span className="font-mono">
                    {currency} {item.price.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5 space-y-3">
          {lines.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed text-center text-subtle">
              <div>
                <ScanLine className="mx-auto mb-3 size-9" />
                <p>Scan or search to add the first item.</p>
              </div>
            </div>
          ) : (
            lines.map((line, index) => (
              <article
                key={`${line.variantId}-${line.packagingId}`}
                className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <strong>{line.label}</strong>
                  <p className="text-sm text-subtle">
                    {line.packaging} · {currency}{" "}
                    {line.unitPrice.toLocaleString()}
                  </p>
                  <label className="mt-2 block text-xs">
                    Line discount{" "}
                    <input
                      value={line.discount}
                      onChange={(e) =>
                        setLines((current) =>
                          current.map((x, i) =>
                            i === index
                              ? { ...x, discount: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      className="ml-2 w-24 rounded-lg border px-2 py-1"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Reduce ${line.label}`}
                    className="grid size-10 place-items-center rounded-lg border"
                    onClick={() =>
                      setLines((current) =>
                        current.flatMap((x, i) =>
                          i === index
                            ? x.quantity > 1
                              ? [{ ...x, quantity: x.quantity - 1 }]
                              : []
                            : [x],
                        ),
                      )
                    }
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-10 text-center font-mono">
                    {line.quantity}
                  </span>
                  <button
                    aria-label={`Add ${line.label}`}
                    className="grid size-10 place-items-center rounded-lg border"
                    onClick={() =>
                      setLines((current) =>
                        current.map((x, i) =>
                          i === index ? { ...x, quantity: x.quantity + 1 } : x,
                        ),
                      )
                    }
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <button
                  aria-label={`Remove ${line.label}`}
                  onClick={() =>
                    setLines((current) => current.filter((_, i) => i !== index))
                  }
                  className="grid size-10 place-items-center rounded-lg text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" />
                </button>
              </article>
            ))
          )}
        </div>
      </section>
      <aside className="rounded-2xl border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold">Checkout</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>
              {currency} {totals.subtotal.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>
              - {currency} {totals.discount.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>
              {currency} {totals.tax.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-xl font-semibold">
            <dt>Total</dt>
            <dd>
              {currency} {totals.total.toLocaleString()}
            </dd>
          </div>
        </dl>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Split payment</h3>
            <button
              onClick={() =>
                setPayments((x) => [
                  ...x,
                  {
                    methodId: methods[0]?.id ?? "",
                    amount: remaining,
                    tendered: remaining,
                    reference: "",
                  },
                ])
              }
              className="text-sm font-semibold text-accent"
            >
              + Add tender
            </button>
          </div>
          {payments.map((payment, index) => {
            const method = methods.find((m) => m.id === payment.methodId);
            return (
              <div key={index} className="grid gap-2 rounded-xl bg-muted p-3">
                <select
                  value={payment.methodId}
                  onChange={(e) =>
                    setPayments((x) =>
                      x.map((p, i) =>
                        i === index ? { ...p, methodId: e.target.value } : p,
                      ),
                    )
                  }
                  className="min-h-10 rounded-lg border bg-surface px-2"
                >
                  {methods
                    .filter(
                      (m) =>
                        !m.branch_id || m.branch_id === terminal?.branch_id,
                    )
                    .map((m) => (
                      <option value={m.id} key={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
                <input
                  aria-label="Payment amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payment.amount}
                  onChange={(e) =>
                    setPayments((x) =>
                      x.map((p, i) =>
                        i === index
                          ? { ...p, amount: Number(e.target.value) }
                          : p,
                      ),
                    )
                  }
                  className="min-h-10 rounded-lg border px-2"
                />
                {method?.method_type === "CASH" && (
                  <input
                    aria-label="Cash tendered"
                    type="number"
                    min={payment.amount}
                    step="0.01"
                    value={payment.tendered}
                    onChange={(e) =>
                      setPayments((x) =>
                        x.map((p, i) =>
                          i === index
                            ? { ...p, tendered: Number(e.target.value) }
                            : p,
                        ),
                      )
                    }
                    className="min-h-10 rounded-lg border px-2"
                    placeholder="Cash tendered"
                  />
                )}
                {method?.requires_reference && (
                  <input
                    value={payment.reference}
                    onChange={(e) =>
                      setPayments((x) =>
                        x.map((p, i) =>
                          i === index ? { ...p, reference: e.target.value } : p,
                        ),
                      )
                    }
                    required
                    className="min-h-10 rounded-lg border px-2"
                    placeholder="Transaction reference"
                  />
                )}
                <button
                  onClick={() =>
                    setPayments((x) => x.filter((_, i) => i !== index))
                  }
                  className="text-left text-xs text-danger"
                >
                  Remove tender
                </button>
              </div>
            );
          })}
          <label className="block rounded-xl border p-3 text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <CreditCard className="size-4" />
              Customer credit (pay later)
            </span>
            <input
              value={credit}
              onChange={(e) => setCredit(Number(e.target.value))}
              type="number"
              min="0"
              max={totals.total}
              step="0.01"
              className="mt-2 min-h-10 w-full rounded-lg border px-2"
            />
            <small className="text-subtle">
              Named customers only. Existing credit-limit controls remain
              authoritative.
            </small>
          </label>
          {availableCredits.length > 0 ? (
            <div className="grid gap-2 rounded-xl border p-3 text-sm">
              <span className="font-semibold">
                Use store / unapplied credit
              </span>
              <select
                value={creditSourceId}
                onChange={(event) => {
                  setCreditSourceId(event.target.value);
                  setStoreCreditAmount(0);
                }}
                className="min-h-10 rounded-lg border px-2"
              >
                <option value="">Select available credit</option>
                {availableCredits.map((item) => (
                  <option key={item.source_id} value={item.source_id ?? ""}>
                    {item.document_number} · {currency}{" "}
                    {Number(item.unapplied_amount).toLocaleString()}
                  </option>
                ))}
              </select>
              <input
                aria-label="Store credit amount"
                type="number"
                min="0"
                max={Number(selectedCredit?.unapplied_amount ?? 0)}
                step="0.01"
                value={storeCreditAmount}
                onChange={(event) =>
                  setStoreCreditAmount(Number(event.target.value))
                }
                className="min-h-10 rounded-lg border px-2"
                disabled={!selectedCredit}
              />
              <small className="text-subtle">
                Allocates an existing payment or Credit Note balance. No fake
                payment is created.
              </small>
            </div>
          ) : null}
          <p
            className={`rounded-lg p-3 text-sm font-semibold ${remaining > 0 ? "bg-warning-soft" : "bg-positive-soft"}`}
          >
            Remaining: {currency} {remaining.toLocaleString()}
          </p>
        </div>
        <form action={holdCart} className="mt-4">
          <input type="hidden" name="sessionId" value={activeSession.id} />
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="cart" value={JSON.stringify(lines)} />
          <input type="hidden" name="cartId" value="" />
          <input type="hidden" name="notes" value="" />
          <Button
            type="submit"
            variant="secondary"
            disabled={!lines.length}
            className="w-full"
          >
            <Pause className="size-4" /> Hold cart
          </Button>
        </form>
        <form
          action={completeSale}
          onSubmit={() => setBusy(true)}
          className="mt-3"
        >
          <input type="hidden" name="sessionId" value={activeSession.id} />
          <input type="hidden" name="customerId" value={customerId} />
          <input
            type="hidden"
            name="lines"
            value={JSON.stringify(linesPayload)}
          />
          <input
            type="hidden"
            name="settlements"
            value={JSON.stringify(
              settlements.map((x) => ({
                source_type: x.sourceType,
                payment_method_id: x.paymentMethodId,
                account_id: x.accountId,
                source_id: x.sourceId,
                amount: x.amount,
                tendered_amount: x.tenderedAmount,
                reference: x.reference,
              })),
            )}
          />
          <input type="hidden" name="customerCreditAmount" value={credit} />
          <input
            type="hidden"
            name="cashTendered"
            value={payments.reduce((n, x) => n + x.tendered, 0)}
          />
          <input type="hidden" name="notes" value="POS checkout" />
          <input type="hidden" name="heldCartId" value={heldCartId} />
          <input type="hidden" name="idempotencyKey" value={checkoutKey} />
          <Button
            disabled={busy || !lines.length || remaining > 0}
            className="min-h-14 w-full text-base"
          >
            {busy ? "Completing sale…" : "Complete sale"}
          </Button>
        </form>
        {held.length > 0 && (
          <details className="mt-5 border-t pt-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Held carts ({held.length})
            </summary>
            <div className="mt-3 space-y-2">
              {held
                .filter((x) => x.session_id === activeSession.id)
                .map((cart) => (
                  <button
                    key={cart.id}
                    onClick={() => {
                      setLines(
                        Array.isArray(cart.cart)
                          ? (cart.cart as PosLine[])
                          : [],
                      );
                      setCustomerId(cart.customer_id ?? customerId);
                      setHeldCartId(cart.id);
                    }}
                    className="w-full rounded-lg border p-3 text-left text-sm"
                  >
                    {Array.isArray(cart.cart) ? cart.cart.length : 0} items ·{" "}
                    {cart.notes ?? "Held sale"}
                  </button>
                ))}
            </div>
          </details>
        )}
      </aside>
    </div>
  );
}
