"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { importCatalogue, type CatalogueActionState } from "../actions";
import { validateCatalogueCsv } from "../csv";

export function CatalogueImportForm() {
  const [state, action, pending] = useActionState<
    CatalogueActionState,
    FormData
  >(importCatalogue, {});
  const [csv, setCsv] = useState("");
  const [name, setName] = useState("catalogue.csv");
  const preview = validateCatalogueCsv(csv);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="csv" value={csv} />
      <input type="hidden" name="fileName" value={name} />
      <ActionFeedback {...state} />
      {state.summary && (
        <p className="rounded-xl bg-muted p-4 font-medium">{state.summary}</p>
      )}
      <label className="block rounded-2xl border border-dashed bg-surface p-8 text-center">
        <span className="font-semibold">Choose a CSV file</span>
        <input
          className="mt-4 block w-full text-sm"
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              setName(file.name);
              setCsv(await file.text());
            }
          }}
        />
      </label>
      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Line</th>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Validation</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((row) => (
                <tr key={row.line} className="border-t">
                  <td className="p-3">{row.line}</td>
                  <td className="p-3">{row.data.product_name}</td>
                  <td className="p-3">{row.data.sku || "Generated"}</td>
                  <td
                    className={
                      row.errors.length
                        ? "p-3 text-danger"
                        : "p-3 text-positive"
                    }
                  >
                    {row.errors.join("; ") || "Ready"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button
        disabled={
          pending || !preview.length || preview.some((r) => r.errors.length)
        }
      >
        {pending ? "Importing..." : `Import ${preview.length} products`}
      </Button>
    </form>
  );
}
