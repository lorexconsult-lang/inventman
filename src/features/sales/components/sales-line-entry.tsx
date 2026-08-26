"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Result = {
  variantId: string;
  packagingId: string;
  label: string;
  packaging: string;
  sku: string | null;
  price: number | null;
  available: number;
  tax: number;
};
export type SalesLine = Result & {
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
};
export function SalesLineEntry({
  branchId,
  priceListId,
  name = "linesJson",
  onChange,
  initialLines = [],
}: {
  branchId: string;
  priceListId: string;
  name?: string;
  onChange?: (lines: SalesLine[]) => void;
  initialLines?: SalesLine[];
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [lines, setLines] = useState<SalesLine[]>(initialLines);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      const p = new URLSearchParams({ q, branchId, priceListId });
      const response = await fetch(`/dashboard/sales/products/search?${p}`, {
        signal: abort.signal,
      });
      if (response.ok) setResults(await response.json());
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [q, branchId, priceListId]);
  useEffect(() => onChange?.(lines), [lines, onChange]);
  const add = (r: Result) => {
    setLines((x) => [
      ...x,
      { ...r, quantity: 1, unit_price: r.price ?? 0, discount: 0, tax: r.tax },
    ]);
    setQ("");
    setResults([]);
  };
  const update = (
    i: number,
    key: "quantity" | "unit_price" | "discount" | "tax",
    value: string,
  ) =>
    setLines((x) =>
      x.map((l, n) => (n === i ? { ...l, [key]: Number(value) } : l)),
    );
  return (
    <fieldset className="space-y-3 md:col-span-full">
      <legend className="font-semibold">Sales lines</legend>
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(
          lines.map((l) => ({
            product_variant_id: l.variantId,
            packaging_id: l.packagingId,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount: l.discount,
            tax: l.tax,
          })),
        )}
      />
      <div className="relative">
        <label className="text-sm font-medium">
          Find product, SKU, barcode or internal code
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border px-3"
            placeholder="Type at least 2 characters"
            autoComplete="off"
          />
        </label>
        {q.trim().length >= 2 && results.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-surface shadow-xl">
            {results.map((r) => (
              <button
                type="button"
                key={`${r.variantId}-${r.packagingId}`}
                onClick={() => add(r)}
                className="flex w-full justify-between gap-4 border-b p-3 text-left text-sm hover:bg-muted"
              >
                <span>
                  <strong>{r.label}</strong>
                  <br />
                  <span className="text-subtle">
                    {r.sku || "No SKU"} · {r.packaging}
                  </span>
                </span>
                <span className="text-right">
                  {r.price ?? "No price"}
                  <br />
                  <span className="text-subtle">Available {r.available}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {lines.length === 0 ? (
        <p className="rounded-xl bg-muted p-4 text-sm text-subtle">
          Search and add at least one product. The catalogue is searched on the
          server.
        </p>
      ) : (
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div
              key={`${l.variantId}-${l.packagingId}-${i}`}
              className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-6"
            >
              <div className="lg:col-span-2">
                <strong>{l.label}</strong>
                <p className="text-xs text-subtle">
                  {l.sku || "No SKU"} · {l.packaging} · available {l.available}
                </p>
              </div>
              {(
                [
                  ["quantity", "Quantity"],
                  ["unit_price", "Unit price"],
                  ["discount", "Discount"],
                  ["tax", "Tax"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs">
                  {label}
                  <input
                    value={l[key]}
                    onChange={(e) => update(i, key, e.target.value)}
                    type="number"
                    min="0"
                    step="any"
                    className="mt-1 min-h-10 w-full rounded-lg border px-2"
                  />
                </label>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLines((x) => x.filter((_, n) => n !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
