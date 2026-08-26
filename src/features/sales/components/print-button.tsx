"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border px-4 py-2 text-sm font-semibold print:hidden"
    >
      {label}
    </button>
  );
}
